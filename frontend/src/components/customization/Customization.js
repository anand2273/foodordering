export default function CustomizationGroup({ group, selectedOptions, setSelectedOptions }) {
  const selected = selectedOptions[group.name] || [];

  const toggleOption = (option) => {
    let updated = [...selected];
    const exists = updated.find(o => o.name === option.name);

    if (exists) {
      updated = updated.filter(o => o.name !== option.name);
    } else {
      if (updated.length < group.max_choices) {
        updated.push(option);
      }
    }

    setSelectedOptions(prev => ({
      ...prev,
      [group.name]: updated
    }));
  };

  return (
    <div className="mb-4">
      <h3 className="font-semibold text-gray-800">{group.name}{group.required ? " *" : ""}</h3>
      <div className="space-y-2 mt-2">
        {group.options.map(option => (
          <CustomizationOption
            key={option.name}
            option={option}
            checked={selected.some(o => o.name === option.name)}
            onChange={() => toggleOption(option)}
          />
        ))}
      </div>
    </div>
  );
}

export function CustomizationOption({ option, checked, onChange }) {
  return (
    <label className="flex items-center space-x-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
      />
      <span className="text-gray-700">
        {option.name} {Number(option.extra_cost) > 0 && <span className="text-sm text-gray-500">(+${Number(option.extra_cost).toFixed(2)})</span>}
      </span>
    </label>
  );
}

