
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL!
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

// 타입 정의
export interface Facility {
  id: string
  facility_code: string
  sequence_no?: number
  number_no?: number
  equipment_code: string
  equipment_type: string
  facility_name: string
  install_date?: string
  install_location: string
  lifespan?: string
  specification?: string
  inspection_period?: string
  quantity: number
  manager?: string
  original_remarks?: string
  legal_inspection?: boolean // 새로 추가된 필드
  created_at: string
  updated_at: string
}

export interface Inspection {
  id: string
  facility_id: string
  last_inspection_date?: string
  next_inspection_date?: string
  status: string
  inspector?: string
  result?: string
  created_at: string
  updated_at: string
}

export interface AdditionalRemark {
  id: string
  facility_id: string
  date: string
  author: string
  content: string
  created_at: string
}

// 법정점검 상태 타입
export type RequiredInspectionStatus = 'overdue' | 'urgent' | 'warning' | 'normal' | 'no_date'

export interface RequiredInspectionStatusInfo {
  status: RequiredInspectionStatus
  daysLeft: number | null
  message: string
}
