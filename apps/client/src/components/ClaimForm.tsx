import { useNavigate } from "react-router-dom"
import { useState } from "react"

export default function ClaimForm() {
  const navigate = useNavigate()

  // form state
  const [insuranceType, setInsuranceType] = useState("Health")
  const [policyNumber, setPolicyNumber] = useState("")
  const [email, setEmail] = useState("")
  const [dateOfIncident, setDateOfIncident] = useState("")
  const [claimAmount, setClaimAmount] = useState("")
  const [tenure, setTenure] = useState("1")
  const [location, setLocation] = useState("")
  const [description, setDescription] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const claimData = {
      customer_id: policyNumber,
      amount: parseFloat(claimAmount),
      tenure: parseInt(tenure),
      description: description,
      date_of_incident: dateOfIncident
    }

    try {
      const response = await fetch("http://localhost:8000/api/claims", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(claimData),
      })

      const data = await response.json()

      if (response.ok) {
        console.log("Submitted Successfully:", data)
        // Pass response data to status page if needed, for now just navigate
        navigate("/status")
      } else {
        alert("Error submitting claim: " + (data.detail || "Unknown error"))
      }
    } catch (error) {
      console.error("Submission error:", error)
      alert("Failed to connect to server.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="card" onSubmit={handleSubmit}>
      <h3>Claim Submission Form</h3>
      <p className="subtitle">
        This is the data collection layer for your AI pipeline.
      </p>

      <label>Insurance Type *</label>
      <select
        value={insuranceType}
        onChange={(e) => setInsuranceType(e.target.value)}
        required
      >
        <option value="Health">Health</option>
        <option value="Accident">Accident</option>
        <option value="Theft">Theft</option>
      </select>

      <div className="row">
        <div>
          <label>Policy Number *</label>
          <input
            type="text"
            value={policyNumber}
            onChange={(e) => setPolicyNumber(e.target.value)}
            required
            placeholder="e.g. POL-123456"
          />
        </div>
        <div>
          <label>Customer Tenure (Years)</label>
          <input
            type="number"
            min="0"
            max="100"
            value={tenure}
            onChange={(e) => setTenure(e.target.value)}
          />
        </div>
      </div>

      <label>Your Email *</label>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      {/* DATE + AMOUNT ROW */}
      <div className="row">
        <div>
          <label>Date of Incident *</label>
          <input
            type="date"
            value={dateOfIncident}
            onChange={(e) => setDateOfIncident(e.target.value)}
            required
          />
        </div>

        <div>
          <label>Claim Amount ($) *</label>
          <input
            type="number"
            placeholder="Enter amount"
            value={claimAmount}
            onChange={(e) => setClaimAmount(e.target.value)}
            required
          />
        </div>
      </div>

      <label>Location *</label>
      <input
        type="text"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        required
      />

      <label>Claim Description *</label>
      <textarea
        placeholder="Describe the incident..."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        required
      />

      <label>Upload Documents (optional)</label>
      <input type="file" />

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Processing..." : "Submit Claim"}
      </button>
    </form>
  )
}