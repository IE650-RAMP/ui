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
            const modulesWithUUID: Module[] = modulesData.map(module => ({
                ...module,
                uuid: uuidv4(),
            }));

            setModules(modulesWithUUID);
        } catch (error) {
            console.error('Error fetching module data:', error);
        }
    };

    const handleModuleSelection = (moduleUuid: string) => {
        const isSelected = selectedModules.includes(moduleUuid);

        if (isSelected) {
            const module = modules.find(m => m.uuid === moduleUuid);
            if (module) {
                const dependentModules = getDependentModules(moduleUuid);
                if (dependentModules.length > 0) {
                    setDialogModules(dependentModules);
                    setModuleToDeselect(module);
                    setOpenDialog(true);
                } else {
                    deselectModule(moduleUuid);
                }
            }
        } else {
            setSelectedModules(prev => [...prev, moduleUuid]);
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

    const selectedModuleCodes = useMemo(() => {
        return modules
            .filter(m => selectedModules.includes(m.uuid))
            .map(m => m.code);
    }, [modules, selectedModules]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    const filteredModules = useMemo(() => {
        if (!searchTerm.trim()) return modules;

        return modules.filter(
            module =>
                module.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                module.code.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [modules, searchTerm]);

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
            <div className="mb-4">
                <input
                    type="text"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    placeholder="Search modules by name or code..."
                    className="w-80 p-2 border border-gray-300 rounded-md"
                />
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