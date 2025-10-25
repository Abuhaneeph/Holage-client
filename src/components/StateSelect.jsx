const StateSelect = ({ label, placeholder = "Select state", value, onChange, name, required = false }) => {
  const nigerianStates = [
    "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", 
    "Benue", "Borno", "Cross River", "Delta", "Ebonyi", "Edo", 
    "Ekiti", "Enugu", "Gombe", "Imo", "Jigawa", "Kaduna", 
    "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", 
    "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", 
    "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara"
  ]

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-text-secondary mb-2">
          {label}
        </label>
      )}
      <select 
        className="w-full px-4 py-3 bg-input border border-border rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 text-text-primary [&>option]:bg-white [&>option]:text-gray-900"
        value={value}
        onChange={onChange}
        name={name}
        required={required}
      >
        <option value="" className="bg-white text-gray-900">
          {placeholder}
        </option>
        {nigerianStates.map((state) => (
          <option 
            key={state.toLowerCase().replace(/\s+/g, '-')} 
            value={state.toLowerCase().replace(/\s+/g, '-')} 
            className="bg-white text-gray-900"
          >
            {state}
          </option>
        ))}
      </select>
    </div>
  )
}

export default StateSelect

