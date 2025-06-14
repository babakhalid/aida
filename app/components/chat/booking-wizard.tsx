"use client"

import { Calendar, Check, CaretLeft, CaretRight, User, Envelope, Phone } from "@phosphor-icons/react"
import { motion } from "motion/react"
import { useState } from "react"

interface BookingWizardProps {
  result: any
  parameters: any
}

interface Service {
  id: string
  name: string
  icon: React.ElementType | (() => React.JSX.Element)
  description: string
}

const services: Service[] = [
  { 
    id: "tennis-court", 
    name: "Tennis Court", 
    icon: () => (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="10" rx="2"/>
        <line x1="12" y1="7" x2="12" y2="17"/>
        <line x1="7" y1="7" x2="7" y2="17"/>
        <line x1="17" y1="7" x2="17" y2="17"/>
      </svg>
    ),
    description: "Professional tennis courts with equipment"
  },
  { 
    id: "basketball-court", 
    name: "Basketball Court", 
    icon: () => (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 2a10 10 0 0 0 0 20"/>
        <path d="M2 12h20"/>
      </svg>
    ),
    description: "Indoor basketball courts with hoops"
  },
  { 
    id: "swimming-pool", 
    name: "Swimming Pool", 
    icon: () => (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 12h1a7 7 0 0 1 7-7h0c3.1 0 5.9 2 6.8 5"/>
        <path d="M13 11.3a3 3 0 0 1 2-.3h0a3 3 0 0 1 2 .3"/>
        <path d="M18 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/>
        <path d="m2 16 3-2c1-.9 4.2-2.5 6.3-2.5 2.3 0 4 1.6 5.6 2.5L20 16"/>
        <path d="m2 20 3-2c1-.9 4.2-2.5 6.3-2.5 2.3 0 4 1.6 5.6 2.5L20 20"/>
      </svg>
    ),
    description: "Indoor pool with lanes and diving area"
  },
  { 
    id: "gym-session", 
    name: "Gym Session", 
    icon: () => (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.4 14.4 9.6 9.6"/>
        <path d="m21 21-5-5"/>
        <path d="m14 8 4-4 2 2-4 4"/>
        <path d="m17 11 4-4 2 2-4 4"/>
        <path d="m3 21 9-9"/>
        <path d="M11 11 9 9"/>
        <path d="m7 21 2-2"/>
      </svg>
    ),
    description: "Access to gym equipment and facilities"
  },
  { 
    id: "badminton-court", 
    name: "Badminton Court", 
    icon: () => (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16v16H4z"/>
        <line x1="12" y1="4" x2="12" y2="20"/>
        <line x1="4" y1="10" x2="20" y2="10"/>
        <line x1="4" y1="14" x2="20" y2="14"/>
      </svg>
    ),
    description: "Badminton courts with nets and equipment"
  },
  { 
    id: "squash-court", 
    name: "Squash Court", 
    icon: () => (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="2"/>
        <path d="M8 2v20"/>
        <path d="M16 2v20"/>
        <path d="M2 8h20"/>
        <path d="M2 16h20"/>
      </svg>
    ),
    description: "Professional squash courts"
  },
]

export function BookingWizard({ result, parameters }: BookingWizardProps) {
  const isCompleted = result?.success === true && result?.bookingId
  
  // Determine initial step based on what data we have
  const getInitialStep = () => {
    if (isCompleted) return 5 // Go to confirmation
    if (result?.service && result?.date && result?.timeSlot) return 4 // Go to details
    if (result?.service && result?.date) return 3 // Go to time selection
    if (result?.service) return 2 // Go to date selection
    return 1 // Start from service selection
  }
  
  const [step, setStep] = useState(getInitialStep())
  const [selectedService, setSelectedService] = useState<string | null>(() => {
    const serviceName = result?.service || parameters?.service
    return serviceName ? services.find(s => s.name === serviceName)?.id || null : null
  })
  const [selectedDate, setSelectedDate] = useState<Date | null>(() => {
    const dateStr = result?.date || parameters?.date
    return dateStr ? new Date(dateStr) : null
  })
  const [selectedTimeslot, setSelectedTimeslot] = useState<string | null>(
    result?.timeSlot || parameters?.timeSlot || null
  )
  const [customerName, setCustomerName] = useState(result?.customerName || parameters?.customerName || "")
  const [customerEmail, setCustomerEmail] = useState(result?.customerEmail || parameters?.customerEmail || "")
  const [customerPhone, setCustomerPhone] = useState(result?.customerPhone || parameters?.customerPhone || "")

  const handleNext = () => {
    if (step === 1 && !selectedService) return
    if (step === 2 && !selectedDate) return
    if (step === 3 && !selectedTimeslot) return
    if (step === 4 && (!customerName || !customerEmail)) return
    setStep((prev) => prev + 1)
  }

  const handleBack = () => {
    setStep((prev) => prev - 1)
  }

  const handleConfirm = () => {
    if (!selectedService || !selectedDate || !selectedTimeslot || !customerName || !customerEmail) return
    
    const service = services.find(s => s.id === selectedService)
    alert(
      `Booking confirmed!\nService: ${service?.name}\nDate: ${selectedDate.toDateString()}\nTimeslot: ${selectedTimeslot}\nName: ${customerName}\nEmail: ${customerEmail}`
    )
  }

  const steps = [
    { id: 1, title: "Service" },
    { id: 2, title: "Date" },
    { id: 3, title: "Time" },
    { id: 4, title: "Details" },
    { id: 5, title: "Confirm" },
  ]

  const cn = (...classes: string[]): string => classes.filter(Boolean).join(' ')

  const renderIcon = (IconComp: React.ElementType | (() => React.JSX.Element)): React.JSX.Element | null => {
    if (typeof IconComp === 'function' && IconComp.toString().includes('svg')) {
      return <IconComp />
    }
    const Icon = IconComp as React.ElementType
    if (typeof Icon === 'function') {
      return <Icon className="h-5 w-5 text-neutral-400" />
    }
    return null
  }

  // Success state
  if (isCompleted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl mx-auto"
      >
        <div className="border border-green-200 bg-green-50 rounded-lg p-8">
          <div className="text-center mb-6">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-medium text-green-800">Booking Confirmed!</h3>
            <p className="text-green-700 mt-2">{result?.message}</p>
            <p className="text-sm text-green-600 mt-2">
              Confirmation Code: <span className="font-mono font-bold">{result?.confirmationCode}</span>
            </p>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="w-full max-w-2xl mx-auto my-6 border border-gray-200 shadow-lg bg-white rounded-lg">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-semibold text-gray-900">
            🏃‍♂️ Sport Facility Booking
          </h2>
        </div>

        {/* Step Indicator */}
        <div className="relative flex justify-between mb-10">
          <div className="absolute top-3 w-full h-px bg-gray-200" />
          <div 
            className="absolute top-3 h-px bg-blue-500 transition-all duration-300 ease-out" 
            style={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }} 
          />
          {steps.map((s) => (
            <div key={s.id} className="relative flex flex-col items-center z-10">
              <div
                className={cn(
                  "h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold border-2",
                  step >= s.id
                    ? "bg-blue-500 text-white border-blue-500"
                    : "bg-white text-gray-500 border-gray-300"
                )}
                style={{ 
                  transform: step === s.id ? 'scale(1.1)' : 'scale(1)',
                  transition: 'transform 0.2s ease'
                }}
              >
                {step > s.id ? <Check className="h-4 w-4" /> : s.id}
              </div>
              <span className="mt-2 text-xs font-medium text-gray-600">
                {s.title}
              </span>
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="space-y-6">
          {step === 1 && (
            <>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                🏃‍♂️ Select a Service
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {services.map((service) => (
                  <button
                    key={service.id}
                    type="button"
                    className={cn(
                      "h-auto py-4 px-5 w-full flex items-start gap-3 border-2 rounded-lg text-left transition-all duration-200 hover:shadow-md",
                      selectedService === service.id 
                        ? "border-blue-500 bg-blue-50 shadow-md"
                        : "border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300"
                    )}
                    onClick={() => setSelectedService(service.id)}
                  >
                    <div className="mt-1 flex-shrink-0 text-blue-500">
                      {renderIcon(service.icon)}
                    </div>
                    <div className="flex flex-col items-start text-left">
                      <span className="text-sm font-semibold text-gray-800">
                        {service.name}
                      </span>
                      <span className="text-xs text-gray-600 mt-1">
                        {service.description}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                📅 Choose a Date
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {[...Array(7)].map((_, i) => {
                  const date = new Date()
                  date.setDate(date.getDate() + i)
                  
                  return (
                    <button
                      key={i}
                      type="button"
                      className={cn(
                        "py-4 px-3 text-sm border-2 rounded-lg transition-all duration-200 hover:shadow-md",
                        selectedDate && selectedDate.getDate() === date.getDate() 
                          ? "border-blue-500 bg-blue-50 shadow-md"
                          : "border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300"
                      )}
                      onClick={() => setSelectedDate(date)}
                    >
                      <div className="flex flex-col items-center w-full">
                        <span className="text-xs text-gray-500 mb-1">
                          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()]}
                        </span>
                        <span className="text-lg font-bold text-gray-800">
                          {date.getDate()}
                        </span>
                        <span className="text-xs text-gray-500 mt-1">
                          {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][date.getMonth()]}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                🕐 Select a Timeslot
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {["09:00 - 10:00", "10:00 - 11:00", "11:00 - 12:00", "13:00 - 14:00", "14:00 - 15:00", "15:00 - 16:00"].map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    className={cn(
                      "py-4 text-sm border-2 rounded-lg transition-all duration-200 hover:shadow-md",
                      selectedTimeslot === slot 
                        ? "border-blue-500 bg-blue-50 shadow-md"
                        : "border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300"
                    )}
                    onClick={() => setSelectedTimeslot(slot)}
                  >
                    <span className="text-sm font-semibold text-gray-800">
                      {slot}
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                👤 Your Details
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-2">Full Name *</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-2">Email *</label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-2">Phone (Optional)</label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Enter your phone number"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>
            </>
          )}

          {step === 5 && selectedService && selectedDate && selectedTimeslot && customerName && customerEmail && (
            <>
              <h3 className="text-base font-medium text-neutral-800">
                Confirm Your Booking
              </h3>
              <div className="bg-neutral-50 p-6 rounded-md space-y-4 border border-neutral-200">
                <div className="flex items-start">
                  <div className="text-neutral-500 w-20 flex-shrink-0">Service</div>
                  <div className="flex items-center gap-2">
                    <div className="flex-shrink-0 text-neutral-400">
                      {(() => {
                        const service = services.find(s => s.id === selectedService)
                        return service ? renderIcon(service.icon) : null
                      })()}
                    </div>
                    <span className="font-medium text-neutral-800">
                      {services.find(s => s.id === selectedService)?.name}
                    </span>
                  </div>
                </div>
                
                <div className="w-full h-px bg-neutral-200"></div>
                
                <div className="flex items-start">
                  <div className="text-neutral-500 w-20 flex-shrink-0">Date</div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-neutral-400" />
                    <span className="font-medium text-neutral-800">
                      {`${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][selectedDate.getDay()]}, ${['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][selectedDate.getMonth()]} ${selectedDate.getDate()}, ${selectedDate.getFullYear()}`}
                    </span>
                  </div>
                </div>
                
                <div className="w-full h-px bg-neutral-200"></div>
                
                <div className="flex items-start">
                  <div className="text-neutral-500 w-20 flex-shrink-0">Time</div>
                  <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-400">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <span className="font-medium text-neutral-800">
                      {selectedTimeslot}
                    </span>
                  </div>
                </div>
                
                <div className="w-full h-px bg-neutral-200"></div>
                
                <div className="flex items-start">
                  <div className="text-neutral-500 w-20 flex-shrink-0">Contact</div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-neutral-400" />
                      <span className="font-medium text-neutral-800">{customerName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Envelope className="h-4 w-4 text-neutral-400" />
                      <span className="font-medium text-neutral-800">{customerEmail}</span>
                    </div>
                    {customerPhone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-neutral-400" />
                        <span className="font-medium text-neutral-800">{customerPhone}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="mt-6 pt-4 border-t border-neutral-200">
                  <div className="flex items-center text-neutral-600 text-sm">
                    <Check className="h-4 w-4 mr-2 text-green-500" />
                    Facility is available for your selected time
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-6 border-t border-gray-200 mt-6">
            {step > 1 && (
              <button
                type="button"
                onClick={handleBack}
                className="border-2 border-gray-300 text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 rounded-lg py-3 px-6 text-sm font-semibold flex items-center transition-all duration-200"
              >
                <CaretLeft className="mr-2 h-4 w-4" /> Back
              </button>
            )}
            {step < 5 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={
                  (step === 1 && !selectedService) ||
                  (step === 2 && !selectedDate) ||
                  (step === 3 && !selectedTimeslot) ||
                  (step === 4 && (!customerName || !customerEmail))
                }
                className={cn(
                  "bg-blue-500 hover:bg-blue-600 text-white rounded-lg py-3 px-6 text-sm font-semibold flex items-center transition-all duration-200 ml-auto shadow-md hover:shadow-lg",
                  ((step === 1 && !selectedService) ||
                   (step === 2 && !selectedDate) ||
                   (step === 3 && !selectedTimeslot) ||
                   (step === 4 && (!customerName || !customerEmail))) ? "opacity-50 cursor-not-allowed" : ""
                )}
              >
                Continue <CaretRight className="ml-2 h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleConfirm}
                className="bg-green-500 hover:bg-green-600 text-white rounded-lg py-3 px-6 text-sm font-semibold flex items-center transition-all duration-200 ml-auto shadow-md hover:shadow-lg"
              >
                🎉 Confirm Booking <Check className="ml-2 h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}