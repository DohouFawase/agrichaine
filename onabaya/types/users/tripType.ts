export type TripeStatus = 'scheduled'| 'ongoing' | 'completed'| 'cancelled'
export type TripeType = {
    transporter_id:string
    departure_city:string
    destination_city:string
    available_weight:number
    dateTime:Date
    status:TripeStatus
}