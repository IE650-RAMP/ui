// module-card.tsx

import React, {useState} from 'react';
import {FaLock, FaUnlock} from 'react-icons/fa';
import {Copy} from 'lucide-react';
import {getHueFromModuleCode} from '@/components/ui/colorUtils';
import styles from './module-card.module.css';

type Module = {
    uuid: string;
    id: number;
    code: string;
    name: string;
    semesters: number[];
    ects: number;
    prerequisites: string[];        // URIs of prerequisites
    prerequisiteNames: string[];    // Names of prerequisites
    subjectArea: string[];
    assessment?: string[];
    examDuration?: number[];
    lecturer?: string[];
    personInCharge?: string[];
    offeredIn?: string[];
    literature?: string[];
    workloadPerson?: number[];
    workloadSelf?: number[];
    furtherModule?: string[];
    examDistribution?: string[];
    assessmentForm?: string[];
    additionalPrereqList?: string[];
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

    /**
     * Extracts the module code from its URI.
     * @param uri - The module URI.
     * @returns The module code.
     */
    const extractModuleCode = (uri: string): string => {
        return uri.split('/').pop() || uri;
    };

    /**
     * Determines if the module should be greyed out based on prerequisites and selection elsewhere.
     * @param module - The module to check.
     * @returns True if the module is greyed out, false otherwise.
     */
    const isModuleGreyedOut = (module: Module) => {
        if (isSelected) return false;

        const prerequisitesMet = module.prerequisites.every(prereqUri => {
            const extractedPrereqCode = extractModuleCode(prereqUri);
            const selectedPrereq = allModules.find(m =>
                m.code === extractedPrereqCode &&
                selectedModules.includes(m.uuid) &&
                Math.min(...m.semesters) < currentSemester
            );
            return !!selectedPrereq;
        });

        return !prerequisitesMet || selectedElsewhere;
    };

    /**
     * Checks if all prerequisites for the module are met.
     * @param module - The module to check.
     * @returns True if prerequisites are met, false otherwise.
     */
    const arePrerequisitesMet = (module: Module): boolean => {
        return module.prerequisites.every(prereqUri => {
            const extractedPrereqCode = extractModuleCode(prereqUri);
            const selectedPrereq = allModules.find(m =>
                m.code === extractedPrereqCode &&
                selectedModules.includes(m.uuid) &&
                Math.min(...m.semesters) < currentSemester
            );
            return !!selectedPrereq;
        });
    };

    /**
     * Retrieves the names of the prerequisites for display.
     * @param module - The module whose prerequisites are to be retrieved.
     * @returns A string listing all prerequisite module names and codes.
     */
    const getPrerequisiteNames = (module: Module): string => {
        return module.prerequisites
            .map(prereqUri => {
                const extractedPrereqCode = extractModuleCode(prereqUri);
                const prereqModule = allModules.find(m => m.code === extractedPrereqCode);
                return prereqModule
                    ? `${prereqModule.name} (${prereqModule.code})`
                    : `Module ${extractedPrereqCode}`;
            })
            .join(', ');
    };

    /**
     * Determines the background color of the module card based on selection and prerequisites.
     * @param module - The module to determine color for.
     * @returns The HSL color string.
     */
    const getModuleColor = (module: Module) => {
        if (isSelected) {
            const hue = getHueFromModuleCode(module.code);
            const saturation = 70;
            const lightness = 50;
            const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
            return color;
        } else if (selectedElsewhere) {
            return `hsl(0, 0%, 70%)`;
        } else if (isModuleGreyedOut(module)) {
            return `hsl(0, 0%, 70%)`;
        } else {
            const hue = getHueFromModuleCode(module.code);
            const saturation = 70;
            const lightness = 69;
            const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
            return color;
        }
    };

    /**
     * Determines a darker shade of the module's color for icons and buttons.
     * @param module - The module to determine color for.
     * @returns The darker HSL color string.
     */
    const getDarkerModuleColor = (module: Module) => {
        if (isModuleGreyedOut(module)) {
            return `hsl(0, 0%, 50%)`;
        }
        const hue = getHueFromModuleCode(module.code);
        const saturation = 70;
        const lightness = isSelected ? 30 : 40;
        const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
        return color;
    };

    const greyedOut = isModuleGreyedOut(module);
    const prerequisitesMet = arePrerequisitesMet(module);

    // Define a color mapping for subject areas (removed as background colors are not needed)
    // const subjectAreaColorMap: { [key: string]: string } = {
    //     "Fundamentals": "bg-blue-500",
    //     "Data Management": "bg-green-500",
    //     "Data Analytics": "bg-yellow-500",
    //     "Responsible Data Science": "bg-purple-500",
    //     "Data Science Applications": "bg-indigo-500",
    //     "Projects and Seminars": "bg-pink-500",
    //     "Master's Thesis": "bg-red-500",
    //     // Add more mappings as needed
    // };

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
                    greyedOut ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:opacity-90'
                } transition-opacity duration-200 ${
                    isSelected ? 'outline outline-2 outline-black outline-offset-[-2px]' : ''
                } relative ${styles.moduleCard}`}
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
                {/* Subject Areas as Small Headers (Moved to Top) */}
                {module.subjectArea && module.subjectArea.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                        {module.subjectArea.map((area, idx) => (
                            <span
                                key={idx}
                                className="text-xs font-medium text-left"
                                title={area}
                                aria-label={`Subject Area: ${area}`}
                            >
                                {area}
                            </span>
                        ))}
                    </div>
                )}

                {/* Module Details */}
                <h3 className="font-semibold">
                    {module.name} ({module.code})
                </h3>
                <p className="text-sm">ECTS: {module.ects}</p>

                {/* Removed Prerequisites and Additional Prerequisites from the Card */}

                {/* Icons */}
                <div className="flex justify-between items-center mt-4">
                    <div className="flex space-x-2">
                        {selectedElsewhere && (
                            <div
                                className="p-1 rounded"
                                style={{backgroundColor: getDarkerModuleColor(module)}}
                            >
                                <Copy className="text-white" size={16}
                                      aria-label="Already selected in another semester"/>
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

                    {/* Details Button */}
                    <button
                        className="px-3 py-1 rounded transition"
                        style={{
                            backgroundColor: getDarkerModuleColor(module),
                            color: 'white',
                            cursor: 'pointer',
                        }}
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsDialogOpen(true);
                        }}
                        title="View module details"
                        aria-label={`View details for ${module.name}`}
                    >
                        Details
                    </button>
                </div>
            </div>

            {/* Dialog for Module Details */}
            {isDialogOpen && (
                <div
                    className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
                    onClick={() => setIsDialogOpen(false)}
                >
                    <div
                        className="bg-white p-6 rounded-md shadow-md w-96 max-h-full overflow-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-lg font-bold mb-4">{module.name} Details</h2>
                        <div className="space-y-2">
                            <p><strong>Code:</strong> {module.code}</p>
                            <p><strong>ECTS:</strong> {module.ects}</p>
                            {/* ... existing fields ... */}
                            {module.examDistribution && module.examDistribution.length > 0 && (
                                <p><strong>Exam Distribution:</strong> {module.examDistribution.join(', ')}</p>
                            )}
                            {module.examDuration && module.examDuration.length > 0 && (
                                <p><strong>Exam Duration:</strong> {module.examDuration.join(', ')} minutes</p>
                            )}
                            {module.assessmentForm && module.assessmentForm.length > 0 && (
                                <p><strong>Assessment Form:</strong> {module.assessmentForm.join(', ')}</p>
                            )}
                            {/* ... other fields ... */}
                        </div>

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
