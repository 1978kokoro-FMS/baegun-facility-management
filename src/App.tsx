// @ts-nocheck
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from './lib/supabase';
import { AlertTriangle, CheckCircle, Settings, ArrowLeft, MapPin, Calendar, User, FileText, Clock, AlertCircle, BarChart2 } from 'lucide-react';
import './App.css';

import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// 타입 정의
interface Facility {
  id: string;
  facility_code: string;
  equipment_type: string;
  facility_name: string;
  install_date?: string;
  install_location: string;
  lifespan?: string;
  manager?: string;
  original_remarks?: string;
  legal_inspection?: boolean;
}
interface Inspection {
  status: string;
  last_inspection_date?: string;
  next_inspection_date?: string;
}
interface FacilityWithInspection extends Facility {
  inspection?: Inspection;
}

// 설비코드별 정보
const equipmentTypes = {
  'AH': { name: '공조설비', color: 'bg-blue-500', bgLight: 'bg-blue-50', textDark: 'text-blue-800' },
  'BO': { name: '열원설비', color: 'bg-orange-500', bgLight: 'bg-orange-50', textDark: 'text-orange-800' },
  'SF': { name: '소화설비', color: 'bg-red-500', bgLight: 'bg-red-50', textDark: 'text-red-800' },
  'PP': { name: '펌프설비', color: 'bg-teal-500', bgLight: 'bg-teal-50', textDark: 'text-teal-800' },
  'FA': { name: '급/배기팬', color: 'bg-cyan-500', bgLight: 'bg-cyan-50', textDark: 'text-cyan-800' },
  'WA': { name: '탱크설비', color: 'bg-emerald-500', bgLight: 'bg-emerald-50', textDark: 'text-emerald-800' },
  'SW': { name: '수영장·수처리설비', color: 'bg-sky-500', bgLight: 'bg-sky-50', textDark: 'text-sky-800' },
  'EL': { name: '전기설비', color: 'bg-indigo-500', bgLight: 'bg-indigo-50', textDark: 'text-indigo-800' },
  'EV': { name: '승강설비', color: 'bg-pink-500', bgLight: 'bg-pink-50', textDark: 'text-pink-800' },
  'EC': { name: '제어설비', color: 'bg-green-500', bgLight: 'bg-green-50', textDark: 'text-green-800' },
  'BC': { name: '방송설비', color: 'bg-purple-500', bgLight: 'bg-purple-50', textDark: 'text-purple-800' },
  'DZ': { name: '재난설비', color: 'bg-rose-500', bgLight: 'bg-rose-50', textDark: 'text-rose-800' },
  'IT': { name: '전산설비', color: 'bg-violet-500', bgLight: 'bg-violet-50', textDark: 'text-violet-800' },
  'AT': { name: '건축설비', color: 'bg-stone-500', bgLight: 'bg-stone-50', textDark: 'text-stone-800' }
};

const globalStyle = `
  /* 대시보드 그리드 스타일 */
  .dashboard-summary-grid { display: grid !important; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)) !important; gap: 1.25rem !important; }
  .dashboard-equipment-grid { display: grid !important; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)) !important; gap: 1.25rem !important; }

  /* 상세 페이지 카드 그리드 스타일 */
  .facility-grid { display: grid !important; grid-template-columns: repeat(auto-fit, minmax(550px, 1fr)) !important; gap: 2rem !important; width: 100% !important; }
  .facility-card { display: block !important; box-sizing: border-box !important; background: white !important; border-radius: 0.5rem !important; padding: 2.5rem !important; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1) !important; }
  .facility-title { font-size: 2.2rem !important; font-weight: 600 !important; color: #111827 !important; margin-bottom: 1.5rem !important; }
  .facility-content { font-size: 1.6rem !important; color: #4b5563 !important; line-height: 1.6 !important; }
  .facility-button { font-size: 1.4rem !important; padding: 0.8rem 1.8rem !important; border-radius: 0.375rem !important; border: 1px solid transparent !important; }
  .facility-input { width: 100%; font-size: 1.6rem !important; padding: 0.8rem 1.2rem !important; border: 1px solid #d1d5db !important; border-radius: 0.375rem !important; margin-top: 0.5rem; }
  .facility-icon { width: 1.8rem !important; height: 1.8rem !important; }
`;

function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedEquipment, setSelectedEquipment] = useState('');
  const [facilities, setFacilities] = useState<FacilityWithInspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingFacility, setEditingFacility] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState({});

  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = globalStyle;
    document.head.appendChild(styleElement);
    return () => { document.head.removeChild(styleElement); };
  }, []);

  const fetchFacilities = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data: facilitiesData, error: facilitiesError } = await supabase.from('baegun_facilities').select('*');
      const { data: inspectionsData, error: inspectionsError } = await supabase.from('baegun_inspections').select('*');
      if (facilitiesError || inspectionsError) throw new Error('데이터를 불러올 수 없습니다.');
      const combinedData = facilitiesData.map(facility => ({
        ...facility,
        inspection: inspectionsData.find(insp => insp.facility_id === facility.id)
      })) || [];
      setFacilities(combinedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류 발생');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFacilities(); }, []);

  const legalInspectionFacilities = useMemo(() => facilities.filter(f => f.legal_inspection), [facilities]);

  const getLegalInspectionStatus = (facility: FacilityWithInspection) => {
    if (!facility.legal_inspection) return { status: 'not_applicable', message: 'N/A' };
    if (!facility.inspection?.next_inspection_date) return { status: 'no_date', message: '일정 미설정' };
    const nextDate = new Date(facility.inspection.next_inspection_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = nextDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { status: 'overdue', message: `${Math.abs(diffDays)}일 초과` };
    if (diffDays <= 7) return { status: 'urgent', message: `${diffDays}일 남음` };
    if (diffDays <= 30) return { status: 'warning', message: `${diffDays}일 남음` };
    return { status: 'normal', message: `${diffDays}일 남음` };
  };

  const facilitiesWithAgingInfo = useMemo(() => {
    const today = new Date();
    return facilities
      .map(facility => {
        if (!facility.install_date || !facility.lifespan) return { ...facility, ageYears: null, remainingYears: null, expiryDate: null };
        const lifespanYears = parseInt(facility.lifespan.replace('년', ''));
        if (isNaN(lifespanYears)) return { ...facility, ageYears: null, remainingYears: null, expiryDate: null };
        const installDate = new Date(facility.install_date);
        const expiryDate = new Date(installDate.getFullYear() + lifespanYears, installDate.getMonth(), installDate.getDate());
        const ageMillis = today.getTime() - installDate.getTime();
        const ageYears = ageMillis / (1000 * 60 * 60 * 24 * 365.25);
        const remainingMillis = expiryDate.getTime() - today.getTime();
        const remainingYears = remainingMillis / (1000 * 60 * 60 * 24 * 365.25);
        return { ...facility, ageYears, remainingYears, expiryDate };
      })
      .filter(f => f.ageYears !== null);
  }, [facilities]);

  const expiringSoonFacilities = useMemo(() => {
    return facilitiesWithAgingInfo
      .filter(f => f.remainingYears !== null && f.remainingYears < 3)
      .sort((a, b) => a.remainingYears - b.remainingYears);
  }, [facilitiesWithAgingInfo]);

  const averageAgeByType = useMemo(() => {
    const byType = {};
    facilitiesWithAgingInfo.forEach(f => {
      const type = equipmentTypes[f.equipment_type]?.name || f.equipment_type;
      if (!byType[type]) byType[type] = { totalAge: 0, count: 0 };
      byType[type].totalAge += f.ageYears;
      byType[type].count++;
    });
    const result = {};
    for (const type in byType) {
      result[type] = byType[type].totalAge / byType[type].count;
    }
    return Object.entries(result).sort(([, avgAgeA], [, avgAgeB]) => avgAgeB - avgAgeA);
  }, [facilitiesWithAgingInfo]);

  const handleBackToDashboard = () => setCurrentView('dashboard');
  const handleEquipmentClick = (code: string) => { setSelectedEquipment(code); setCurrentView('facility-list'); };
  const handleGoToLegalInspection = () => setCurrentView('legal-inspection');
  const getSelectedFacilities = () => facilities.filter(f => f.facility_code?.substring(4, 6) === selectedEquipment);

  const handleEditSave = async (facilityId: string) => {
    console.log("Saving changes for", facilityId, editFormData);
    setEditingFacility(null);
  };
  
  const dashboardStats = useMemo(() => {
    const stats = {};
    Object.keys(equipmentTypes).forEach(code => {
      const matched = facilities.filter(f => f.facility_code?.substring(4, 6) === code);
      stats[code] = {
        total: matched.length,
        normal: matched.filter(f => f.inspection?.status === 'normal').length,
        warning: matched.filter(f => f.inspection?.status === 'warning').length,
        danger: matched.filter(f => f.inspection?.status === 'danger').length,
      };
    });
    return stats;
  }, [facilities]);
  
  const legalStats = useMemo(() => {
    const stats = { total: legalInspectionFacilities.length, overdue: 0, urgent: 0, warning: 0, normal: 0, noDate: 0 };
    legalInspectionFacilities.forEach(facility => {
        const status = getLegalInspectionStatus(facility).status;
        if (stats[status] !== undefined) stats[status]++;
    });
    return stats;
  }, [legalInspectionFacilities]);

  const hasOverdueLegalInspection = legalStats.overdue > 0;

  if (loading) return <div>로딩 중...</div>;
  if (error) return <div>오류 발생: {error}</div>;

  const EditForm = ({ facility, onSave, onCancel }) => (
    <div className="space-y-4">
      <label>시설물 이름: <input type="text" value={editFormData.facility_name ?? facility.facility_name} onChange={e => setEditFormData({...editFormData, facility_name: e.target.value})} className="facility-input" /></label>
      <label>설치 위치: <input type="text" value={editFormData.install_location ?? facility.install_location} onChange={e => setEditFormData({...editFormData, install_location: e.target.value})} className="facility-input" /></label>
      <label>관리 담당자: <input type="text" value={editFormData.manager ?? facility.manager} onChange={e => setEditFormData({...editFormData, manager: e.target.value})} className="facility-input" /></label>
      <label>마지막 점검일: <input type="date" value={editFormData.last_inspection_date ?? facility.inspection?.last_inspection_date ?? ''} onChange={e => setEditFormData({...editFormData, last_inspection_date: e.target.value})} className="facility-input" /></label>
      <label>다음 점검일: <input type="date" value={editFormData.next_inspection_date ?? facility.inspection?.next_inspection_date ?? ''} onChange={e => setEditFormData({...editFormData, next_inspection_date: e.target.value})} className="facility-input" /></label>
      <label>비고: <textarea value={editFormData.original_remarks ?? facility.original_remarks ?? ''} onChange={e => setEditFormData({...editFormData, original_remarks: e.target.value})} className="facility-input h-24"></textarea></label>
      <div className="flex justify-end space-x-2 mt-4">
        <button onClick={onCancel} className="facility-button bg-gray-200 hover:bg-gray-300">취소</button>
        <button onClick={onSave} className="facility-button bg-blue-500 text-white hover:bg-blue-600">저장</button>
      </div>
    </div>
  );

  if (currentView === 'analysis') {
    const chartData = {
      labels: expiringSoonFacilities.slice(0, 5).map(f => f.facility_name),
      datasets: [{ label: '잔여 수명 (년)', data: expiringSoonFacilities.slice(0, 5).map(f => f.remainingYears.toFixed(2)), backgroundColor: 'rgba(54, 162, 235, 0.6)' }],
    };
    return (
      <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12"><button onClick={handleBackToDashboard} className="flex items-center text-blue-600 hover:text-blue-800 mb-8 text-xl"><ArrowLeft className="w-8 h-8 mr-4" />대시보드로 돌아가기</button><h1 className="text-5xl font-bold text-gray-900 mb-4">통합 분석</h1><p className="text-2xl text-gray-600">시설물 데이터 분석 및 예측</p></div>
          <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">수명 및 노후화 분석</h2>
            <h3 className="text-2xl font-semibold text-gray-700 mt-6 mb-3">수명 만료 임박 시설물 (3년 이내)</h3>
            <div className="overflow-x-auto"><table className="min-w-full bg-white border"><thead className="bg-gray-200"><tr><th className="py-2 px-4 border">시설물 이름</th><th className="py-2 px-4 border">설비 종류</th><th className="py-2 px-4 border">설치일</th><th className="py-2 px-4 border">수명 만료일</th><th className="py-2 px-4 border">잔여 수명</th></tr></thead>
              <tbody>{expiringSoonFacilities.map(f => (<tr key={f.id} className={f.remainingYears < 1 ? 'bg-red-100' : 'bg-yellow-100'}><td className="py-2 px-4 border">{f.facility_name}</td><td className="py-2 px-4 border">{equipmentTypes[f.equipment_type]?.name}</td><td className="py-2 px-4 border">{f.install_date}</td><td className="py-2 px-4 border">{f.expiryDate.toLocaleDateString()}</td><td className="py-2 px-4 border font-bold">{f.remainingYears.toFixed(1)}년</td></tr>))}{expiringSoonFacilities.length === 0 && (<tr><td colSpan="5" className="text-center py-4">3년 내 수명 만료 예정인 시설물이 없습니다.</td></tr>)}</tbody>
            </table></div>
            <h3 className="text-2xl font-semibold text-gray-700 mt-8 mb-3">수명 만료 임박 Top 5 시설물 (그래프)</h3>
            <div className="p-4 border rounded-lg">{expiringSoonFacilities.length > 0 ? <Bar data={chartData} /> : <p>표시할 데이터가 없습니다.</p>}</div>
            <h3 className="text-2xl font-semibold text-gray-700 mt-8 mb-3">설비 종류별 평균 사용 연수</h3>
            <div className="overflow-x-auto"><table className="min-w-full bg-white border"><thead className="bg-gray-200"><tr><th className="py-2 px-4 border">설비 종류</th><th className="py-2 px-4 border">평균 사용 연수</th></tr></thead>
              <tbody>{averageAgeByType.map(([type, avgAge]) => (<tr key={type}><td className="py-2 px-4 border">{type}</td><td className="py-2 px-4 border">{avgAge.toFixed(1)}년</td></tr>))}</tbody>
            </table></div>
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'legal-inspection') {
    return (
      <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12"><button onClick={handleBackToDashboard} className="flex items-center text-blue-600 hover:text-blue-800 mb-8 text-xl"><ArrowLeft className="w-8 h-8 mr-4" />대시보드로 돌아가기</button><h1 className="text-5xl font-bold text-gray-900 mb-4">법정점검 관리</h1><p className="text-2xl text-gray-600">법정점검 대상 시설물 목록입니다.</p></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <div className="bg-red-100 p-4 rounded-lg text-center"><h3 className="font-semibold text-red-800">점검 초과</h3><p className="text-3xl font-bold text-red-600">{legalStats.overdue}</p></div>
            <div className="bg-orange-100 p-4 rounded-lg text-center"><h3 className="font-semibold text-orange-800">긴급 (7일 이내)</h3><p className="text-3xl font-bold text-orange-600">{legalStats.urgent}</p></div>
            <div className="bg-yellow-100 p-4 rounded-lg text-center"><h3 className="font-semibold text-yellow-800">주의 (30일 이내)</h3><p className="text-3xl font-bold text-yellow-600">{legalStats.warning}</p></div>
            <div className="bg-green-100 p-4 rounded-lg text-center"><h3 className="font-semibold text-green-800">정상</h3><p className="text-3xl font-bold text-green-600">{legalStats.normal}</p></div>
            <div className="bg-gray-100 p-4 rounded-lg text-center"><h3 className="font-semibold text-gray-800">일정 미설정</h3><p className="text-3xl font-bold text-gray-600">{legalStats.noDate}</p></div>
          </div>
          <div className="facility-grid">
            {legalInspectionFacilities.map(facility => {
              const isEditing = editingFacility === facility.id;
              const inspectionStatus = getLegalInspectionStatus(facility);
              const getStatusStyle = status => ({'overdue': 'border-red-500 bg-red-50', 'urgent': 'border-orange-500 bg-orange-50', 'warning': 'border-yellow-500 bg-yellow-50'})[status] || 'border-green-500 bg-green-50';
              const getStatusIcon = status => ({'overdue': <AlertTriangle className="w-6 h-6 text-red-500" />, 'urgent': <Clock className="w-6 h-6 text-orange-500" />, 'warning': <AlertCircle className="w-6 h-6 text-yellow-500" />})[status] || <CheckCircle className="w-6 h-6 text-green-500" />;
              return (
                <div key={facility.id} className={`facility-card border-l-4 ${getStatusStyle(inspectionStatus.status)}`}>
                  <div className="flex justify-between items-start mb-4"><div className="flex items-center">{getStatusIcon(inspectionStatus.status)}<h2 className="facility-title ml-3">{facility.facility_name}</h2></div></div>
                  {isEditing ? <EditForm facility={facility} onSave={() => handleEditSave(facility.id)} onCancel={() => setEditingFacility(null)} /> : (<div className="facility-content space-y-3"><p className="flex items-center"><MapPin className="facility-icon mr-3 text-gray-500" /> <strong>위치:</strong> {facility.install_location}</p><p className="flex items-center"><User className="facility-icon mr-3 text-gray-500" /> <strong>관리 담당:</strong> {facility.manager || '미지정'}</p><p className="font-semibold text-lg">{inspectionStatus.message}</p><div className="flex justify-end mt-4"><button onClick={() => { setEditingFacility(facility.id); setEditFormData({ ...facility, ...facility.inspection }); }} className="facility-button bg-gray-100 text-gray-800 hover:bg-gray-200">수정</button></div></div>)}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'facility-list') {
    const facilitiesToShow = getSelectedFacilities();
    const equipmentInfo = equipmentTypes[selectedEquipment];
    return (
      <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12"><button onClick={handleBackToDashboard} className="flex items-center text-blue-600 hover:text-blue-800 mb-8 text-xl"><ArrowLeft className="w-8 h-8 mr-4" />대시보드로 돌아가기</button><h1 className="text-5xl font-bold text-gray-900 mb-4">{equipmentInfo?.name} 상세 목록</h1><p className="text-2xl text-gray-600">총 {facilitiesToShow.length}개의 {equipmentInfo?.name} 시설물</p></div>
          <div className="facility-grid">
            {facilitiesToShow.map(facility => {
              const isEditing = editingFacility === facility.id;
              const getStatusStyle = status => ({'danger': 'border-red-500 bg-red-50', 'warning': 'border-yellow-500 bg-yellow-50'})[status] || 'border-green-500 bg-green-50';
              const getStatusIcon = status => ({'danger': <AlertTriangle className="w-6 h-6 text-red-500" />, 'warning': <AlertCircle className="w-6 h-6 text-yellow-500" />})[status] || <CheckCircle className="w-6 h-6 text-green-500" />;
              return (
                <div key={facility.id} className={`facility-card border-l-4 ${getStatusStyle(facility.inspection?.status)}`}>
                  <div className="flex justify-between items-start mb-4"><div className="flex items-center">{getStatusIcon(facility.inspection?.status)}<h2 className="facility-title ml-3">{facility.facility_name}</h2></div>{facility.legal_inspection && <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">법정점검</span>}</div>
                  {isEditing ? <EditForm facility={facility} onSave={() => handleEditSave(facility.id)} onCancel={() => setEditingFacility(null)} /> : (<div className="facility-content space-y-3"><p className="flex items-center"><MapPin className="facility-icon mr-3 text-gray-500" /> <strong>위치:</strong> {facility.install_location}</p><p className="flex items-center"><User className="facility-icon mr-3 text-gray-500" /> <strong>관리 담당:</strong> {facility.manager || '미지정'}</p><p className="flex items-center"><FileText className="facility-icon mr-3 text-gray-500" /> <strong>비고:</strong> {facility.original_remarks || '없음'}</p><p className="flex items-center"><Calendar className="facility-icon mr-3 text-gray-500" /> <strong>다음 점검일:</strong> {facility.inspection?.next_inspection_date || '미설정'}</p><div className="flex justify-end mt-4"><button onClick={() => { setEditingFacility(facility.id); setEditFormData({ ...facility, ...facility.inspection }); }} className="facility-button bg-gray-100 text-gray-800 hover:bg-gray-200">수정</button></div></div>)}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  const totalNormal = facilities.filter(f=>f.inspection?.status === 'normal').length;
  const totalWarning = facilities.filter(f=>f.inspection?.status === 'warning').length;
  const totalDanger = facilities.filter(f=>f.inspection?.status === 'danger').length;

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-screen-xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800">시설물 관리 시스템</h1>
        <p className="text-lg text-gray-500 mb-6">백운커뮤니티센터 통합 시설물 관리</p>
        <div className="flex items-center space-x-2 mb-6">
          <button onClick={() => setCurrentView('dashboard')} className="px-4 py-2 bg-gray-800 text-white font-semibold rounded-md shadow-md">전체 대시보드</button>
          <button onClick={handleGoToLegalInspection} className="relative px-4 py-2 bg-white text-gray-800 font-semibold rounded-md border border-gray-300 shadow-sm hover:bg-gray-50">법정점검 관리
            {legalStats.overdue > 0 && <span className="absolute -top-2 -right-2 flex h-6 w-6"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-6 w-6 bg-red-500 text-white text-xs font-bold items-center justify-center">{legalStats.overdue}</span></span>}
          </button>
          <button onClick={() => setCurrentView('analysis')} className="flex items-center px-4 py-2 bg-white text-gray-800 font-semibold rounded-md border">
            <BarChart2 className="w-5 h-5 mr-2" />통합 분석
          </button>
        </div>
        <div className="dashboard-summary-grid mb-6">
          <div className="bg-blue-600 text-white p-5 rounded-lg shadow-lg flex items-center"><div className="bg-white/30 p-3 rounded-full mr-4"><Settings className="w-6 h-6" /></div><div><div className="text-4xl font-extrabold">{facilities.length}</div><div className="text-blue-200 font-semibold">전체 시설물</div></div></div>
          <div className="bg-green-500 text-white p-5 rounded-lg shadow-lg flex items-center"><div className="bg-white/30 p-3 rounded-full mr-4"><CheckCircle className="w-6 h-6" /></div><div><div className="text-4xl font-extrabold">{totalNormal}</div><div className="text-green-200 font-semibold">정상 상태</div></div></div>
          <div className="bg-yellow-500 text-white p-5 rounded-lg shadow-lg flex items-center"><div className="bg-white/30 p-3 rounded-full mr-4"><AlertCircle className="w-6 h-6" /></div><div><div className="text-4xl font-extrabold">{totalWarning}</div><div className="text-yellow-200 font-semibold">주의 상태</div></div></div>
          <div className="bg-red-600 text-white p-5 rounded-lg shadow-lg flex items-center"><div className="bg-white/30 p-3 rounded-full mr-4"><AlertTriangle className="w-6 h-6" /></div><div><div className="text-4xl font-extrabold">{totalDanger}</div><div className="text-red-200 font-semibold">위험 상태</div></div></div>
          <button onClick={handleGoToLegalInspection} className="bg-white border-2 border-dashed border-gray-300 text-gray-500 p-5 rounded-lg shadow-sm flex flex-col items-center justify-center hover:border-blue-500 hover:text-blue-500 transition-colors"><FileText className="w-8 h-8 mb-2" /><span className="font-semibold">법정점검 대상</span><span className="font-bold text-2xl">{legalStats.total}</span></button>
        </div>
        {hasOverdueLegalInspection && <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center justify-between shadow-sm"><div className="flex items-center"><AlertTriangle className="w-6 h-6 text-red-500 mr-3" /><div className='flex items-baseline'><p className="text-red-800 font-semibold mr-2">법정점검 주의 알림</p><p className="text-red-700">{legalStats.overdue}개 시설물의 점검이 초과되었습니다.</p></div></div><button onClick={handleGoToLegalInspection} className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 text-sm font-semibold whitespace-nowrap">법정점검 관리로 이동</button></div>}
        <h2 className="text-2xl font-bold text-gray-800 mb-4">설비별 현황</h2>
        <div className="dashboard-equipment-grid">
          {Object.entries(equipmentTypes).map(([code, info]) => {
            const stats = dashboardStats[code] || { total: 0 };
            if (stats.total === 0) return null;
            return (
              <div key={code} onClick={() => handleEquipmentClick(code)} className={`bg-white rounded-lg shadow-md p-5 relative cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ${info.bgLight}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-3xl font-extrabold text-gray-700 mb-2">{stats.total}</p>
                    <div className="flex items-center space-x-3">
                      <span className={`w-10 h-10 flex items-center justify-center rounded-full ${info.color} text-white font-bold shadow-md`}>{code}</span>
                      <p className={`text-lg font-bold ${info.textDark}`}>{info.name}</p>
                    </div>
                  </div>
                  <div className="text-right text-gray-600 text-sm">
                    <p>정상: <span className="font-bold text-gray-800">{stats.normal}</span></p>
                    <p>주의: <span className="font-bold text-gray-800">{stats.warning}</span></p>
                    <p>위험: <span className="font-bold text-gray-800">{stats.danger}</span></p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default App;