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
import {v4 as uuidv4} from 'uuid';
import {Progress} from "@/components/ui/progress";
import modulesData from '../../data/modules.json';
import {ModuleCard} from './module-card';
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer";

type Module = {
    uuid: string;
    id: number;
    code: string;
    name: string;
    semesters: number[];
    ects: number;
    prerequisites: string[];
    subjectArea: string;
};

type SubjectAreaRequirement = {
    name: string;
    minCredits: number;
    maxCredits: number;
};

const subjectAreaRequirements: SubjectAreaRequirement[] = [
    {name: "Fundamentals", minCredits: 27, maxCredits: 27},
    {name: "Data Management", minCredits: 6, maxCredits: 24},
    {name: "Data Analytics", minCredits: 12, maxCredits: 36},
    {name: "Responsible Data Science", minCredits: 3, maxCredits: 7},
    {name: "Data Science Applications", minCredits: 0, maxCredits: 12},
    {name: "Projects and Seminars", minCredits: 14, maxCredits: 18},
    {name: "Master's Thesis", minCredits: 30, maxCredits: 30}
];

export const ModulePlanner = () => {
    const [modules, setModules] = useState<Module[]>([]);
    const [selectedModules, setSelectedModules] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [openDialog, setOpenDialog] = useState(false);
    const [dialogModules, setDialogModules] = useState<Module[]>([]);
    const [moduleToDeselect, setModuleToDeselect] = useState<Module | null>(null);
    const [hideUnfulfilled, setHideUnfulfilled] = useState(false);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

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

    const calculateSubjectAreaProgress = () => {
        const progress = new Map<string, number>();

        // Initialize all subject areas with 0 credits
        subjectAreaRequirements.forEach(area => {
            progress.set(area.name, 0);
        });

        // Calculate total ECTS per subject area from selected modules
        selectedModules.forEach(uuid => {
            const module = modules.find(m => m.uuid === uuid);
            if (module) {
                const currentCredits = progress.get(module.subjectArea) || 0;
                progress.set(module.subjectArea, currentCredits + module.ects);
            }
        });

        return progress;
    };

    const isModuleSelectedElsewhere = (module: Module): boolean => {
        return modules.some(m =>
            selectedModules.includes(m.uuid) && // is selected
            m.code === module.code && // same module code
            m.uuid !== module.uuid // different instance
        );
    };

    const arePrerequisitesFulfilled = (module: Module, currentSemester: number): boolean => {
        return module.prerequisites.every(prereqCode => {
            // Find any selected module that matches the prerequisite code
            const selectedPrereq = modules.find(m =>
                m.code === prereqCode &&
                selectedModules.includes(m.uuid) &&
                Math.min(...m.semesters) < currentSemester // Must be in earlier semester
            );
            return !!selectedPrereq;
        });
    };


    const handleModuleSelection = (moduleUuid: string) => {
        const clickedModule = modules.find(m => m.uuid === moduleUuid);
        if (!clickedModule) return;

        const currentSemester = Math.min(...clickedModule.semesters);
        const isSelected = selectedModules.includes(moduleUuid);

        if (isSelected) {
            const dependentModules = getDependentModules(moduleUuid);
            if (dependentModules.length > 0) {
                setDialogModules(dependentModules);
                setModuleToDeselect(clickedModule);
                setOpenDialog(true);
            } else {
                deselectModule(moduleUuid);
            }
        } else {
            // Check prerequisites before allowing selection
            if (!arePrerequisitesFulfilled(clickedModule, currentSemester)) {
                return; // Don't allow selection if prerequisites aren't met
            }

            const existingSelectedInstance = modules.find(m =>
                selectedModules.includes(m.uuid) &&
                m.code === clickedModule.code
            );

            if (existingSelectedInstance) {
                setSelectedModules(prev =>
                    prev
                        .filter(uuid => uuid !== existingSelectedInstance.uuid)
                        .concat(moduleUuid)
                );
            } else {
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

    const selectedModuleCodes = useMemo(() => {
        return modules
            .filter(m => selectedModules.includes(m.uuid))
            .map(m => m.code);
    }, [modules, selectedModules]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    // Modify filteredModules to use the new prerequisite check
    const filteredModules = useMemo(() => {
        let filtered = modules;

        if (searchTerm.trim()) {
            filtered = filtered.filter(
                module =>
                    module.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    module.code.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (hideUnfulfilled) {
            filtered = filtered.filter(module => {
                const currentSemester = Math.min(...module.semesters);
                return arePrerequisitesFulfilled(module, currentSemester) ||
                    selectedModules.includes(module.uuid);
            });
        }

        return filtered;
    }, [modules, searchTerm, hideUnfulfilled, selectedModules]);

    const renderProgressDrawer = () => {
        const progress = calculateSubjectAreaProgress();

        return (
            <DrawerContent className="bg-white">
                {/* Drawer handle */}
                <div className="flex justify-center py-2">
                    <div className="w-48 h-1.5 bg-gray-300 rounded"></div>
                </div>
                <DrawerHeader>
                    <DrawerTitle>Progress</DrawerTitle>
                    <DrawerDescription>
                        Track your progress in each subject area.
                    </DrawerDescription>
                </DrawerHeader>
                <div className="space-y-6 p-4">
                    {subjectAreaRequirements.map(area => {
                        const currentCredits = progress.get(area.name) || 0;
                        const progressPercentage = Math.min(
                            100,
                            (currentCredits / area.maxCredits) * 100
                        );

                        const isOutOfLimits =
                            currentCredits < area.minCredits || currentCredits > area.maxCredits;
                        const barColor = isOutOfLimits ? 'bg-red-300' : 'bg-black';

                        return (
                            <div key={area.name} className="grid grid-cols-[150px_1fr_100px] items-center gap-4">
                                <span className="text-xs font-medium">{area.name}</span>
                                <div className="relative h-3 bg-gray-300 rounded overflow-hidden">
                                    <div
                                        className={`${barColor} h-full rounded transition-all duration-300`}
                                        style={{width: `${progressPercentage}%`}}
                                    />
                                    <div
                                        className="absolute h-3 w-0.5 bg-black top-0"
                                        style={{
                                            left: `${(area.minCredits / area.maxCredits) * 100}%`,
                                            zIndex: 1,
                                        }}
                                        title={`Minimum required: ${area.minCredits} ECTS`}
                                    />
                                </div>
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                    {currentCredits}/{area.minCredits}
                                    {area.maxCredits > area.minCredits && `-${area.maxCredits}`} ECTS
                                </span>
                            </div>
                        );
                    })}
                </div>
                <DrawerFooter>
                    <DrawerClose asChild>
                        <Button variant="outline">Close</Button>
                    </DrawerClose>
                </DrawerFooter>
            </DrawerContent>
        );
    };


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
                                            currentSemester={semester}
                                            allModules={modules}
                                            selectedModules={selectedModules}
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
            <div className="fixed bottom-4 left-0 right-0 flex justify-center">
                <Drawer>
                    <DrawerTrigger asChild>
                        <Button className="bg-black text-white">
                            Show Progress
                        </Button>
                    </DrawerTrigger>
                    {renderProgressDrawer()}
                </Drawer>
            </div>
        </div>
    );
};