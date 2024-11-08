import React, {useState} from 'react';
import {FaLock, FaUnlock} from 'react-icons/fa';
import {Copy} from "lucide-react"; // Icon for indicating selection in other semesters

type Module = {
    uuid: string;
    id: number;
    code: string;
    name: string;
    semesters: number[];
    ects: number;
    prerequisites: string[];
};

type ModuleCardProps = {
    module: Module;
    isSelected: boolean;
    onSelect: (moduleUuid: string) => void;
    selectedModuleCodes: string[];
    selectedElsewhere: boolean;
    currentSemester: number;
    allModules: Module[];
    selectedModules: string[];
};

export const ModuleCard: React.FC<ModuleCardProps> = ({
                                                          module,
                                                          isSelected,
                                                          onSelect,
                                                          selectedModuleCodes,
                                                          selectedElsewhere,
                                                          currentSemester,
                                                          allModules,
                                                          selectedModules,
                                                      }) => {
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const isModuleGreyedOut = (module: Module) => {
        if (isSelected) return false;

        // Check if prerequisites are met in earlier semesters
        const prerequisitesMet = module.prerequisites.every(prereqCode => {
            const selectedPrereq = allModules.find(m =>
                m.code === prereqCode &&
                selectedModules.includes(m.uuid) &&
                Math.min(...m.semesters) < currentSemester
            );
            return !!selectedPrereq;
        });

        return !prerequisitesMet || selectedElsewhere;
    };

    const arePrerequisitesMet = (module: Module): boolean => {
        return module.prerequisites.every(prereqCode => {
            const selectedPrereq = allModules.find(m =>
                m.code === prereqCode &&
                selectedModules.includes(m.uuid) &&
                Math.min(...m.semesters) < currentSemester
            );
            return !!selectedPrereq;
        });
    };

    const getPrerequisiteNames = (module: Module): string => {
        return module.prerequisites
            .map(prereqCode => `Module ${prereqCode}`)
            .join(', ');
    };

    const getModuleColor = (module: Module) => {
        if (isSelected) {
            const hue = (module.id * 137.508) % 360;
            const saturation = 70;
            const lightness = 0;
            return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
        } else if (selectedElsewhere) {
            return `hsl(0, 0%, 70%)`; // Grey for already selected modules
        } else if (isModuleGreyedOut(module)) {
            return `hsl(0, 0%, 70%)`; // Grey for modules with unmet prerequisites
        } else {
            const hue = (module.id * 137.508) % 360;
            const saturation = 70;
            const lightness = 69;
            return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
        }
    };


    const getDarkerModuleColor = (module: Module) => {
        if (isModuleGreyedOut(module)) {
            return `hsl(0, 0%, 50%)`; // Darker grey for greyed-out modules
        }
        const hue = (module.id * 137.508) % 360;
        const saturation = 70;
        const lightness = isSelected ? 20 : 40; // Darker shade
        return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    };

    const greyedOut = isModuleGreyedOut(module);
    const prerequisitesMet = arePrerequisitesMet(module);

    return (
        <>
            <div
                onClick={() => {
                    if (!greyedOut) {
                        onSelect(module.uuid);
                    }
                }}
                style={{backgroundColor: getModuleColor(module)}}
                className={`p-4 rounded-md text-white ${
                    greyedOut ? 'cursor-not-allowed' : 'cursor-pointer'
                } hover:opacity-90 transition-opacity duration-200 ${
                    isSelected ? 'border-black' : ''
                } relative`}
                role="button"
                aria-pressed={isSelected}
                aria-disabled={greyedOut}
                title={
                    selectedElsewhere
                        ? 'This module is already selected in another semester'
                        : greyedOut
                            ? 'Prerequisites not met'
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
                {/* Rest of the JSX remains the same... */}
                <h3 className="font-semibold">
                    {module.name} ({module.code})
                </h3>
                <p className="text-sm">ECTS: {module.ects}</p>
                {module.prerequisites.length > 0 && (
                    <p className="text-xs">
                        Prerequisites: {getPrerequisiteNames(module)}
                    </p>
                )}

                <div className="flex justify-between items-center mt-4">
                    <div className="flex space-x-2">
                        {selectedElsewhere && (
                            <div
                                className="p-1 rounded"
                                style={{backgroundColor: getDarkerModuleColor(module)}}
                            >
                                <Copy className="text-white" size={16} title="Already selected in another semester"/>
                            </div>
                        )}
                        {module.prerequisites.length > 0 && (
                            <div
                                className="p-1 rounded"
                                style={{backgroundColor: getDarkerModuleColor(module)}}
                            >
                                {prerequisitesMet ? (
                                    <FaUnlock className="text-white" title="Prerequisites met"/>
                                ) : (
                                    <FaLock className="text-white" title="Prerequisites not met"/>
                                )}
                            </div>
                        )}
                    </div>

                    <button
                        className="px-3 py-1 rounded transition"
                        style={{
                            backgroundColor: greyedOut ? 'hsl(0, 0%, 50%)' : getDarkerModuleColor(module),
                            color: 'white',
                            cursor: greyedOut ? 'not-allowed' : 'pointer',
                        }}
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsDialogOpen(true);
                        }}
                        disabled={greyedOut}
                    >
                        Details
                    </button>
                </div>
            </div>

            {/* Dialog */}
            {isDialogOpen && (
                <div
                    className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
                    onClick={() => setIsDialogOpen(false)}
                >
                    <div
                        className="bg-white p-6 rounded-md shadow-md w-96"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-lg font-bold mb-4">{module.name} Details</h2>
                        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec vel ligula id nisi pharetra
                            malesuada.</p>
                        <button
                            className="mt-4 px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 transition"
                            onClick={() => setIsDialogOpen(false)}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};
