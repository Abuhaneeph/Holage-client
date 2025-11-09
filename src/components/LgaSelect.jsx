"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import SelectModal from "./SelectModal"

const LgaSelect = ({
  label,
  placeholder = "Select LGA",
  value,
  onChange,
  name,
  required = false,
  options = [],
  disabled = false,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const selectedOption = options.find((opt) => opt.value === value)

  const handleChange = (newValue) => {
    if (!onChange) return
    const syntheticEvent = {
      target: {
        name,
        value: newValue,
      },
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

      <input type="hidden" name={name} value={value} required={required} />

      <button
        type="button"
        onClick={() => !disabled && setIsModalOpen(true)}
        className={`w-full px-4 py-4 bg-input border border-border rounded-xl text-left flex items-center justify-between text-lg transition-colors ${
          disabled ? "opacity-60 cursor-not-allowed" : "hover:bg-muted/50"
        }`}
        disabled={disabled}
      >
        <span className={value ? "text-text-primary font-medium" : "text-text-secondary"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className="w-5 h-5 text-text-secondary" />
      </button>

      <SelectModal
        isOpen={isModalOpen && !disabled}
        onClose={() => setIsModalOpen(false)}
        title={label || "Select LGA"}
        options={options}
        value={value}
        onChange={handleChange}
        searchable={true}
      />
    </div>
  )
}

export default LgaSelect


