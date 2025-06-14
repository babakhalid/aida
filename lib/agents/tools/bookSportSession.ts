export interface BookingData {
  service: string
  date: string
  timeSlot: string
  duration: number
  customerName: string
  customerEmail: string
  customerPhone?: string
}

export async function bookSportSession(data: BookingData) {
  // Always show the wizard for interactive booking experience
  // Check if we have all required data for completion
  const isComplete = data.service && data.date && data.timeSlot && data.customerName && data.customerEmail
  
  if (isComplete) {
    // Complete booking
    const mockBookingId = `booking-${Date.now()}`
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))
    
    return {
      success: true,
      bookingId: mockBookingId,
      service: data.service,
      date: data.date,
      timeSlot: data.timeSlot,
      duration: data.duration || 60,
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      customerPhone: data.customerPhone,
      message: `🎉 Successfully booked ${data.service} for ${data.date} at ${data.timeSlot}`,
      confirmationCode: mockBookingId.toUpperCase(),
      ui: "booking-wizard"
    }
  } else {
    // Return partial data to show wizard - always interactive
    return {
      success: false,
      partial: true,
      service: data.service || "",
      date: data.date || "",
      timeSlot: data.timeSlot || "",
      duration: data.duration || 60,
      customerName: data.customerName || "",
      customerEmail: data.customerEmail || "",
      customerPhone: data.customerPhone || "",
      message: "🏃‍♂️ Complete your sport booking using the interactive wizard below",
      ui: "booking-wizard",
      showWizard: true
    }
  }
}