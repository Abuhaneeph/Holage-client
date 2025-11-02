import { useState } from "react"
import { ChevronDown } from "lucide-react"
import SelectModal from "./SelectModal"

const StateSelect = ({ label, placeholder = "Select state", value, onChange, name, required = false, excludeValue = null }) => {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const nigerianStates = [
    "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", 
    "Benue", "Borno", "Cross River", "Delta", "Ebonyi", "Edo", 
    "Ekiti", "Enugu", "Gombe", "Imo", "Jigawa", "Kaduna", 
    "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", 
    "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", 
    "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara"
  ]

  const allOptions = nigerianStates.map(state => ({
    label: state,
    value: state.toLowerCase().replace(/\s+/g, '-')
  }))

  // Filter out the excluded value
  const options = excludeValue 
    ? allOptions.filter(opt => opt.value !== excludeValue)
    : allOptions

  const selectedState = allOptions.find(opt => opt.value === value)

  const handleChange = (newValue) => {
    // Create a synthetic event to match the expected onChange signature
    const syntheticEvent = {
      target: {
        name: name,
        value: newValue
      }
    }
    onChange(syntheticEvent)
  }

  return (
    <div>
      {label && (
        <label className="block text-text-primary font-medium mb-2">
          {label}
        </label>
      )}
      
      {/* Hidden input for form validation */}
      <input
        type="hidden"
        name={name}
        value={value}
        required={required}
      />

      {/* Clickable button that opens modal */}
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className="w-full px-4 py-4 bg-input border border-border rounded-xl text-left flex items-center justify-between text-lg hover:bg-muted/50 transition-colors"
      >
        <span className={value ? "text-text-primary font-medium" : "text-text-secondary"}>
          {selectedState ? selectedState.label : placeholder}
        </span>
        <ChevronDown className="w-5 h-5 text-text-secondary" />
      </button>

      {/* Modal */}
      <SelectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={label || "Select State"}
        options={options}
        value={value}
        onChange={handleChange}
        searchable={true}
      />
    </div>
  )
}

export default StateSelect

