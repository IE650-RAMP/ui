'use client';

import React, {useState, useEffect, useMemo} from 'react';
import {Card, CardHeader, CardTitle, CardContent} from '@/components/ui/card';
import {v4 as uuidv4} from 'uuid'; // Import the UUID function
import {FaLock} from 'react-icons/fa'; // Import lock icon from react-icons
import modulesData from '../../data/modules.json'; // Adjust the path as necessary

// Define the Module type
type Module = {
    uuid: string;                 // Unique identifier for each module instance
    id: number;                   // Module ID (can be duplicated across semesters)
    code: string;                 // Module code (e.g., "CS109")
    name: string;
    semester: number;
    ects: number;
    prerequisites: string[];      // List of prerequisite module codes
};

export const ModulePlanner = () => {
    const [modules, setModules] = useState<Module[]>([]);
    const [selectedModules, setSelectedModules] = useState<string[]>([]); // Track selected modules by UUID

    useEffect(() => {
        // Fetch module data from the JSON file and assign UUIDs
        fetchModuleData();
    }, []);

    useEffect(() => {
        // Load selected modules from localStorage on mount
        const storedSelectedModules = localStorage.getItem('selectedModules');
        if (storedSelectedModules) {
            setSelectedModules(JSON.parse(storedSelectedModules));
        }
    }, []);

    useEffect(() => {
        // Save selected modules to localStorage whenever it changes
        localStorage.setItem('selectedModules', JSON.stringify(selectedModules));
    }, [selectedModules]);

    const fetchModuleData = async () => {
        // Map through the imported modulesData and assign a UUID to each module
        const modulesWithUUID: Module[] = modulesData.map(module => ({
            ...module,
            uuid: uuidv4()
        }));

        setModules(modulesWithUUID);
    };

    /**
     * Handle the selection of a module.
     * @param moduleUuid - The UUID of the module being selected/deselected.
     * @param moduleCode - The code of the module being selected/deselected.
     */
    const handleModuleSelection = (moduleUuid: string, moduleCode: string) => {
        const isSelected = selectedModules.includes(moduleUuid);

        if (isSelected) {
            // Deselect the module
            setSelectedModules(prev => prev.filter(uuid => uuid !== moduleUuid));
        } else {
            // Select the module and deselect any other modules with the same code
            const modulesToDeselect = modules
                .filter(m => m.code === moduleCode)
                .map(m => m.uuid);
            setSelectedModules(prev => [
                ...prev.filter(uuid => !modulesToDeselect.includes(uuid)),
                moduleUuid
            ]);
        }
    };

    /**
     * Check if a module is currently selected.
     * @param moduleUuid - The UUID of the module to check.
     * @returns True if selected, false otherwise.
     */
    const isModuleSelected = (moduleUuid: string) => selectedModules.includes(moduleUuid);

    /**
     * Compute the list of selected module codes.
     */
    const selectedModuleCodes = useMemo(() => {
        return modules
            .filter(m => selectedModules.includes(m.uuid))
            .map(m => m.code);
    }, [modules, selectedModules]);

    /**
     * Check if a module should be greyed out.
     * A module is greyed out if:
     * - Another module with the same code is selected.
     * - Its prerequisites are not met.
     * @param module - The module to check.
     * @param selectedCodes - The list of currently selected module codes.
     * @returns True if greyed out, false otherwise.
     */
    const isModuleGreyedOut = (module: Module, selectedCodes: string[]) => {
        if (isModuleSelected(module.uuid)) return false; // The selected module itself

        // Check if any module with the same code is selected
        const selectedWithSameCode = selectedModules.some(uuid => {
            const selectedModule = modules.find(m => m.uuid === uuid);
            return selectedModule && selectedModule.code === module.code;
        });

        if (selectedWithSameCode) return true; // Another module with the same code is selected

        // Check if prerequisites are met
        const prerequisitesMet = module.prerequisites.every(prereqCode => selectedCodes.includes(prereqCode));

        return !prerequisitesMet; // Grey out if prerequisites are NOT met
    };

    /**
     * Helper function to map prerequisite codes to module names.
     * @param module - The module whose prerequisites need to be mapped.
     * @returns A string of prerequisite module names and codes.
     */
    const getPrerequisiteNames = (module: Module): string => {
        return module.prerequisites
            .map(prereqCode => {
                const prereqModule = modules.find(m => m.code === prereqCode);
                return prereqModule ? `${prereqModule.name} (${prereqModule.code})` : `Module ${prereqCode}`;
            })
            .join(', ');
    };

    /**
     * Determine the background color of a module based on its state.
     * @param module - The module to determine the color for.
     * @returns A HSL color string.
     */
    const getModuleColor = (module: Module) => {
        if (isModuleSelected(module.uuid)) {
            // Selected module: lightness 0 (black)
            const hue = (module.id * 137.508) % 360;
            const saturation = 70;
            const lightness = 0;
            return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
        } else if (isModuleGreyedOut(module, selectedModuleCodes)) {
            // Greyed out modules: light color indicating unavailability
            return `hsl(0, 0%, 70%)`; // Grey color
        } else {
            // Normal module: pastel color
            const hue = (module.id * 137.508) % 360;
            const saturation = 70;
            const lightness = 69;
            return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
        }
    };

    /**
     * Render the semester columns with their respective modules.
     * @returns JSX elements representing the semesters and modules.
     */
    const renderSemesterColumns = () => {
        const semesters = [...new Set(modules.map((module) => module.semester))].sort((a, b) => a - b);
        const numberOfSemesters = semesters.length;

        return (
            <div
                className="grid gap-4"
                style={{
                    gridTemplateColumns: `repeat(${numberOfSemesters}, 250px)`,
                }}
            >
                {semesters.map((semester) => (
                    <Card key={semester} className="w-full">
                        <CardHeader>
                            <CardTitle>Semester {semester}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {modules
                                    .filter((module) => module.semester === semester)
                                    .map((module) => {
                                        const greyedOut = isModuleGreyedOut(module, selectedModuleCodes);
                                        return (
                                            <div
                                                key={module.uuid} // Use UUID as the key
                                                onClick={() => {
                                                    if (!greyedOut) {
                                                        handleModuleSelection(module.uuid, module.code);
                                                    }
                                                }}
                                                style={{backgroundColor: getModuleColor(module)}}
                                                className={`p-4 rounded-md text-white cursor-${greyedOut ? 'not-allowed' : 'pointer'} hover:opacity-90 transition-opacity duration-200 ${
                                                    isModuleSelected(module.uuid) ? ' border-black' : ''
                                                }`}
                                                role="button"
                                                aria-pressed={isModuleSelected(module.uuid)}
                                                aria-disabled={greyedOut}
                                                title={
                                                    greyedOut
                                                        ? module.prerequisites.length > 0
                                                            ? 'Prerequisites not met'
                                                            : 'Another module with the same code is selected'
                                                        : 'Click to select'
                                                }
                                            >
                                                <h3 className="font-semibold">{module.name} ({module.code})</h3>
                                                <p className="text-sm">ECTS: {module.ects}</p>
                                                {module.prerequisites.length > 0 && (
                                                    <p className="text-xs flex items-center">
                                                        Prerequisites: {getPrerequisiteNames(module)}
                                                        <FaLock className="ml-1" title="Has prerequisites"/>
                                                    </p>
                                                )}
                                            </div>
                                        );
                                    })}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    };

    return (
        <div className="container mx-auto p-4 max-w-7xl"> {/* Corrected max-w class */}
            <h2 className="text-2xl font-bold mb-4">Module Planner</h2>
            {renderSemesterColumns()}
        </div>
    );
};
