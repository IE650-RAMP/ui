// components/ui/ModuleCard.tsx

import React, { memo } from 'react';
import { FaLock } from 'react-icons/fa';

type Module = {
    uuid: string;                 // Unique identifier for each module instance
    id: number;                   // Module ID (can be duplicated across semesters)
    code: string;                 // Module code (e.g., "CS109")
    name: string;
    semester: number;
    ects: number;
    prerequisites: string[];      // List of prerequisite module codes
};

type ModuleCardProps = {
    module: Module;
    isSelected: boolean;
    isGreyedOut: boolean;
    onSelect: (uuid: string, code: string) => void;
    selectedModuleCodes: string[];
    getPrerequisiteNames: (module: Module) => string;
};

const ModuleCard = memo(({ module, isSelected, isGreyedOut, onSelect, selectedModuleCodes, getPrerequisiteNames }: ModuleCardProps) => {
    const handleClick = () => {
        if (!isGreyedOut) {
            onSelect(module.uuid, module.code);
        }
    };

    const getBackgroundColor = () => {
        if (isSelected) {
            const hue = (module.id * 137.508) % 360;
            const saturation = 70;
            const lightness = 0;
            return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
        } else if (isGreyedOut) {
            return `hsl(0, 0%, 70%)`; // Grey color
        } else {
            const hue = (module.id * 137.508) % 360;
            const saturation = 70;
            const lightness = 69;
            return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
        }
    };

    const titleText = isGreyedOut
        ? module.prerequisites.length > 0
            ? 'Prerequisites not met'
            : 'Another module with the same code is selected'
        : 'Click to select';

    return (
        <div
            onClick={handleClick}
            style={{ backgroundColor: getBackgroundColor() }}
            className={`relative p-4 rounded-md text-white cursor-${isGreyedOut ? 'not-allowed' : 'pointer'} hover:opacity-90 transition-opacity duration-200 ${
                isSelected ? 'border-4 border-black' : ''
            }`}
            role="button"
            aria-pressed={isSelected}
            aria-disabled={isGreyedOut}
            title={titleText}
        >
            {/* Lock Icon in the Upper Right Corner */}
            {module.prerequisites.length > 0 && (
                <FaLock
                    className={`absolute top-2 right-2 ${isGreyedOut ? 'text-red-500' : 'text-gray-300'}`}
                    title={isGreyedOut ? 'Prerequisites not met' : 'Has prerequisites'}
                    aria-label="Prerequisites Lock Icon"
                />
            )}

            <h3 className="font-semibold">{module.name} ({module.code})</h3>
            <p className="text-sm">ECTS: {module.ects}</p>
            {module.prerequisites.length > 0 && (
                <p className="text-xs">
                    Prerequisites: {getPrerequisiteNames(module)}
                </p>
            )}
        </div>
    );
});

export default ModuleCard;
