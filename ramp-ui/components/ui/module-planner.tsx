// src/components/ui/ModulePlanner.tsx

'use client';

import React, {useState, useEffect, useMemo} from 'react';
import {Card, CardHeader, CardTitle, CardContent} from '@/components/ui/card';
import {v4 as uuidv4} from 'uuid'; // Import the UUID function
import {FaLock} from 'react-icons/fa'; // Correct named import from react-icons/fa
import modulesData from '../../data/modules.json'; // Adjust the path as necessary

// Define the Module type
type Module = {
    uuid: string;                 // Unique identifier for each module instance
    id: number;                   // Module ID (can be duplicated across semesters)
    code: string;                 // Module code (e.g., "CS101")
    name: string;
    semesters: number[];          // Array of semesters when the module is offered
    ects: number;
    prerequisites: string[];      // List of prerequisite module codes
};

export const ModulePlanner = () => {
    const [modules, setModules] = useState<Module[]>([]);
    const [selectedModules, setSelectedModules] = useState<string[]>([]); // Track selected modules by UUID
    const [searchTerm, setSearchTerm] = useState<string>(''); // Optional: For search functionality

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
        try {
            // Assign a unique UUID to each module
            const modulesWithUUID: Module[] = modulesData.map(module => ({
                ...module,
                uuid: uuidv4()
            }));

            setModules(modulesWithUUID);
        } catch (error) {
            console.error('Error fetching module data:', error);
            // Optionally, set an error state to display to users
        }
    };

    /**
     * Handle the selection of a module.
     * @param moduleUuid - The UUID of the module being selected/deselected.
     */
    const handleModuleSelection = (moduleUuid: string) => {
        const isSelected = selectedModules.includes(moduleUuid);

        if (isSelected) {
            // Deselect the module
            setSelectedModules(prev => prev.filter(uuid => uuid !== moduleUuid));
        } else {
            // Select the module
            setSelectedModules(prev => [...prev, moduleUuid]);
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
     * - Its prerequisites are not met.
     * @param module - The module to check.
     * @returns True if greyed out, false otherwise.
     */
    const isModuleGreyedOut = (module: Module) => {
        if (isModuleSelected(module.uuid)) return false; // The selected module itself

        // Check if prerequisites are met
        const prerequisitesMet = module.prerequisites.every(prereqCode => selectedModuleCodes.includes(prereqCode));

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
        } else if (isModuleGreyedOut(module)) {
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
     * Handle search input changes.
     * @param e - The input change event.
     */
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    /**
     * Compute filtered modules based on search term.
     */
    const filteredModules = useMemo(() => {
        if (!searchTerm.trim()) return modules;

        return modules.filter(module =>
            module.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            module.code.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [modules, searchTerm]);

    /**
     * Render the semester columns with their respective modules.
     * @returns JSX elements representing the semesters and modules.
     */
    const renderSemesterColumns = () => {
        // Extract all unique semesters from filtered modules
        const semesters = [...new Set(filteredModules.flatMap(module => module.semesters))].sort((a, b) => a - b);

        return (
            <div className="flex flex-wrap gap-4 overflow-x-auto">
                {semesters.map((semester) => (
                    <Card key={semester} className="w-80 flex-shrink-0">
                        <CardHeader>
                            <CardTitle>Semester {semester}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {filteredModules
                                    .filter((module) => module.semesters.includes(semester))
                                    .map((module) => {
                                        const greyedOut = isModuleGreyedOut(module);
                                        const isSelected = isModuleSelected(module.uuid);
                                        return (
                                            <div
                                                key={module.uuid}
                                                onClick={() => {
                                                    if (!greyedOut) {
                                                        handleModuleSelection(module.uuid);
                                                    }
                                                }}
                                                style={{backgroundColor: getModuleColor(module)}}
                                                className={`p-4 rounded-md text-white cursor-${greyedOut ? 'not-allowed' : 'pointer'} hover:opacity-90 transition-opacity duration-200 ${
                                                    isSelected ? ' border-black' : ''
                                                }`}
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
                                                            handleModuleSelection(module.uuid);
                                                        }
                                                    }
                                                }}
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
        <div className="container mx-auto p-4 max-w-full">
            <h2 className="text-2xl font-bold mb-4">Module Planner</h2>
            {/* Optional: Search Bar */}
            <div className="mb-4">
                <input
                    type="text"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    placeholder="Search modules by name or code..."
                    className="w-full p-2 border border-gray-300 rounded-md"
                />
            </div>
            {renderSemesterColumns()}
        </div>
    );
};