import React from 'react';
import {FaLock, FaUnlock} from 'react-icons/fa';
import {Module} from './ModulePlanner';

type ModuleCardProps = {
    module: Module;
    isSelected: boolean;
    onSelect: (moduleUuid: string) => void;
    selectedModuleCodes: string[];
};

export const ModuleCard: React.FC<ModuleCardProps> = ({
                                                          module,
                                                          isSelected,
                                                          onSelect,
                                                          selectedModuleCodes,
                                                      }) => {
    const isModuleGreyedOut = (module: Module) => {
        if (isSelected) return false;

        const prerequisitesMet = module.prerequisites.every(prereqCode => selectedModuleCodes.includes(prereqCode));

        return !prerequisitesMet;
    };

    const getPrerequisiteNames = (module: Module): string => {
        return module.prerequisites
            .map(prereqCode => {
                const prereqModule = selectedModuleCodes.find(m => m.code === prereqCode);
                return prereqModule ? `${prereqModule.name} (${prereqModule.code})` : `Module ${prereqCode}`;
            })
            .join(', ');
    };

    const getModuleColor = (module: Module) => {
        if (isSelected) {
            const hue = (module.id * 137.508) % 360;
            const saturation = 70;
            const lightness = 0;
            return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
        } else if (isModuleGreyedOut(module)) {
            return `hsl(0, 0%, 70%)`;
        } else {
            const hue = (module.id * 137.508) % 360;
            const saturation = 70;
            const lightness = 69;
            return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
        }
    };

    const greyedOut = isModuleGreyedOut(module);
    const prerequisitesMet = module.prerequisites.every(prereqCode => selectedModuleCodes.includes(prereqCode));

    return (
        <div
            key={module.uuid}
            onClick={() => {
                if (!greyedOut) {
                    onSelect(module.uuid);
                }
            }}
            style={{backgroundColor: getModuleColor(module)}}
            className={`p-4 rounded-md text-white cursor-${greyedOut ? 'not-allowed' : 'pointer'} hover:opacity-90 transition-opacity duration-200 ${
                isSelected ? ' border-black' : ''
            } relative`}
            role="button"
            aria-pressed={isSelected}
            aria-disabled={greyedOut}
            title={
                greyedOut
                    ? module.prerequisites.length > 0
                        ? 'Prerequisites not met'
                        : 'Module is unavailable'
                    : 'Click to select'
            }
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    if (!greyedOut) {
                        onSelect(module.uuid);
                    }
                }
            }}
        >
            <h3 className="font-semibold">
                {module.name} ({module.code})
            </h3>
            <p className="text-sm">ECTS: {module.ects}</p>
            {module.prerequisites.length > 0 && (
                <p className="text-xs">
                    Prerequisites: {getPrerequisiteNames(module)}
                </p>
            )}
            {module.prerequisites.length > 0 && (
                <div className="absolute top-2 right-2">
                    {prerequisitesMet ? (
                        <FaUnlock className="text-white" title="Prerequisites met"/>
                    ) : (
                        <FaLock className="text-white" title="Prerequisites not met"/>
                    )}
                </div>
            )}
        </div>
    );
};