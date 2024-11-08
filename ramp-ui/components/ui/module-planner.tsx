'use client';

import React, {useState, useEffect, useMemo} from 'react';
import {Card, CardHeader, CardTitle, CardContent} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogFooter,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import {Button} from '@/components/ui/button';
import {Checkbox} from "@/components/ui/checkbox"
import {Clock} from "lucide-react"; // Using Clock icon to indicate selected in different semester
import {v4 as uuidv4} from 'uuid';
import modulesData from '../../data/modules.json';
import {ModuleCard} from './module-card';

type Module = {
    uuid: string;
    id: number;
    code: string;
    name: string;
    semesters: number[];
    ects: number;
    prerequisites: string[];
};

export const ModulePlanner = () => {
    const [modules, setModules] = useState<Module[]>([]);
    const [selectedModules, setSelectedModules] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [openDialog, setOpenDialog] = useState(false);
    const [dialogModules, setDialogModules] = useState<Module[]>([]);
    const [moduleToDeselect, setModuleToDeselect] = useState<Module | null>(null);
    const [hideUnfulfilled, setHideUnfulfilled] = useState(false);

    useEffect(() => {
        fetchModuleData();
    }, []);

    useEffect(() => {
        const storedSelectedModules = localStorage.getItem('selectedModules');
        if (storedSelectedModules) {
            setSelectedModules(JSON.parse(storedSelectedModules));
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('selectedModules', JSON.stringify(selectedModules));
    }, [selectedModules]);

    const fetchModuleData = async () => {
        try {
            const modulesWithUUID: Module[] = modulesData.flatMap(module =>
                module.semesters.map(semester => ({
                    ...module,
                    uuid: uuidv4(),
                    semesters: [semester], // Assign only one semester per module instance
                }))
            );

            setModules(modulesWithUUID);
        } catch (error) {
            console.error('Error fetching module data:', error);
        }
    };

    const isModuleSelectedElsewhere = (module: Module): boolean => {
        // Check if any module with the same code (not UUID) is selected, excluding this instance
        return modules.some(m =>
            selectedModules.includes(m.uuid) && // is selected
            m.code === module.code && // same module code
            m.uuid !== module.uuid // different instance
        );
    };

    const handleModuleSelection = (moduleUuid: string) => {
        const clickedModule = modules.find(m => m.uuid === moduleUuid);
        if (!clickedModule) return;

        const isSelected = selectedModules.includes(moduleUuid);

        if (isSelected) {
            // Handle deselection
            const dependentModules = getDependentModules(moduleUuid);
            if (dependentModules.length > 0) {
                setDialogModules(dependentModules);
                setModuleToDeselect(clickedModule);
                setOpenDialog(true);
            } else {
                deselectModule(moduleUuid);
            }
        } else {
            // Find if any instance of this module (same ID) is already selected
            const existingSelectedInstance = modules.find(m =>
                selectedModules.includes(m.uuid) &&
                m.id === clickedModule.id
            );

            if (existingSelectedInstance) {
                // Replace the existing selection with the new one
                setSelectedModules(prev =>
                    prev
                        .filter(uuid => uuid !== existingSelectedInstance.uuid)
                        .concat(moduleUuid)
                );
            } else {
                // Select the new module
                setSelectedModules(prev => [...prev, moduleUuid]);
            }
        }
    };

    const getDependentModules = (moduleUuid: string): Module[] => {
        const selectedModule = modules.find(module => module.uuid === moduleUuid);
        if (!selectedModule) return [];

        const dependentModules: Module[] = [];

        const traverseDependencies = (module: Module) => {
            const directDependents = modules.filter(m =>
                m.prerequisites.includes(module.code) && selectedModules.includes(m.uuid)
            );

            dependentModules.push(...directDependents);

            directDependents.forEach(dependent => {
                traverseDependencies(dependent);
            });
        };

        traverseDependencies(selectedModule);

        return dependentModules;
    };

    const deselectModule = (moduleUuid: string) => {
        setSelectedModules(prev => prev.filter(uuid => uuid !== moduleUuid));

        const deselectedModule = modules.find(module => module.uuid === moduleUuid);
        if (!deselectedModule) return;

        const dependentModules = getDependentModules(moduleUuid);
        dependentModules.forEach(module => {
            deselectModule(module.uuid);
        });
    };

    const handleConfirmDeselection = () => {
        if (moduleToDeselect) {
            setSelectedModules(prev => prev.filter(uuid => uuid !== moduleToDeselect.uuid));
            dialogModules.forEach(module => {
                setSelectedModules(prev => prev.filter(uuid => uuid !== module.uuid));
            });
            setOpenDialog(false);
            setModuleToDeselect(null);
        }
    };

    const isModuleSelected = (moduleUuid: string) =>
        selectedModules.includes(moduleUuid);

    const isModuleSelectedInOtherSemester = (module: Module): number | null => {
        // Find any module with the same code that is selected
        const moduleWithSameCode = modules.find(m =>
            selectedModules.includes(m.uuid) &&
            m.code === module.code &&
            m.uuid !== module.uuid
        );

        if (moduleWithSameCode) {
            // Return the first semester where it's selected
            return moduleWithSameCode.semesters[0];
        }
        return null;
    };


    const selectedModuleCodes = useMemo(() => {
        return modules
            .filter(m => selectedModules.includes(m.uuid))
            .map(m => m.code);
    }, [modules, selectedModules]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    const filteredModules = useMemo(() => {
        let filtered = modules;

        // Apply search filter
        if (searchTerm.trim()) {
            filtered = filtered.filter(
                module =>
                    module.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    module.code.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Apply visibility filter for unfulfilled prerequisites
        if (hideUnfulfilled) {
            filtered = filtered.filter(module => {
                const prerequisitesMet = module.prerequisites.every(prereqCode =>
                    selectedModuleCodes.includes(prereqCode)
                );
                return prerequisitesMet || selectedModules.includes(module.uuid);
            });
        }

        return filtered;
    }, [modules, searchTerm, hideUnfulfilled, selectedModules, selectedModuleCodes]);

    const renderSemesterColumns = () => {
        const semesters = [
            ...new Set(filteredModules.flatMap(module => module.semesters)),
        ].sort((a, b) => a - b);

        return (
            <div className="flex flex-wrap gap-4 overflow-x-auto">
                {semesters.map(semester => (
                    <Card key={semester} className="w-80 flex-shrink-0">
                        <CardHeader>
                            <CardTitle>Semester {semester}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {filteredModules
                                    .filter(module => module.semesters.includes(semester))
                                    .map(module => (
                                        <ModuleCard
                                            key={module.uuid}
                                            module={module}
                                            isSelected={isModuleSelected(module.uuid)}
                                            onSelect={handleModuleSelection}
                                            selectedModuleCodes={selectedModuleCodes}
                                            selectedElsewhere={isModuleSelectedElsewhere(module)}
                                        />
                                    ))}
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
            <div className="mb-4 flex items-center gap-4">
                <input
                    type="text"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    placeholder="Search modules by name or code..."
                    className="w-80 p-2 border border-gray-300 rounded-md"
                />
                <div className="flex items-center gap-2">
                    <Checkbox
                        id="hideUnfulfilled"
                        checked={hideUnfulfilled}
                        onCheckedChange={(checked) => setHideUnfulfilled(checked === true)}
                    />
                    <label htmlFor="hideUnfulfilled" className="text-sm">
                        Hide modules with unfulfilled prerequisites
                    </label>
                </div>
            </div>
            {renderSemesterColumns()}

            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                <DialogContent className="sm:max-w-[425px] bg-white shadow-lg rounded-lg">
                    <DialogHeader>
                        <DialogTitle>Deselect Dependent Modules</DialogTitle>
                        <DialogDescription>
                            The following modules depend on the module "{moduleToDeselect?.name}" you are deselecting:
                            <ul className="list-disc list-inside mt-2">
                                {dialogModules.map(module => (
                                    <li key={module.uuid}>{module.name}</li>
                                ))}
                            </ul>
                            Deselecting this module will also deselect the dependent modules.
                            Do you want to proceed?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button onClick={handleConfirmDeselection}>Confirm</Button>
                        <Button variant="outline" onClick={() => setOpenDialog(false)}>
                            Cancel
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};