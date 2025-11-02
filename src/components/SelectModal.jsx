import { X, Search, Check } from "lucide-react"
import { useState, useEffect } from "react"

const SelectModal = ({ isOpen, onClose, title, options, value, onChange, searchable = false }) => {
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredOptions, setFilteredOptions] = useState(options)

  useEffect(() => {
    if (searchable && searchQuery) {
      const filtered = options.filter(option =>
        option.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredOptions(filtered)
    } else {
      setFilteredOptions(options)
    }
  }, [searchQuery, options, searchable])

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("")
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSelect = (selectedValue) => {
    onChange(selectedValue)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-card rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 border-b border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-text-primary font-bold text-xl">{title}</h3>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-muted rounded-full flex items-center justify-center"
            >
              <X className="w-5 h-5 text-text-secondary" />
            </button>
          </div>

          {/* Search */}
          {searchable && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-secondary" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-3 bg-input border border-border rounded-xl text-text-primary placeholder-text-secondary focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          )}
        </div>

        {/* Options List */}
        <div className="flex-1 overflow-y-auto">
          {filteredOptions.length > 0 ? (
            <div className="p-2">
              {filteredOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleSelect(option.value)}
                  className={`w-full text-left px-4 py-4 rounded-xl mb-2 transition-colors flex items-center justify-between ${
                    value === option.value
                      ? 'bg-primary/10 border-2 border-primary'
                      : 'bg-muted/30 hover:bg-muted/50 border-2 border-transparent'
                  }`}
                >
                  <span className={`font-medium text-lg ${
                    value === option.value ? 'text-primary' : 'text-text-primary'
                  }`}>
                    {option.label}
                  </span>
                  {value === option.value && (
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <p className="text-text-secondary">No results found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SelectModal

