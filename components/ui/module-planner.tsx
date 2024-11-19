// ModulePlanner.tsx

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
    DialogTrigger,
} from '@/components/ui/dialog';
import {Button} from '@/components/ui/button';
import {Checkbox} from "@/components/ui/checkbox";
import {RadioGroup, RadioGroupItem} from "@/components/ui/radio-group";
import {v4 as uuidv4} from 'uuid';
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
import {ProgressBar} from './progressbar';
import {
    getModules,
    ModuleBinding,
    getStudyPrograms,
    StudyProgram,
    getStudyRequirements,
    StudyRequirement
} from '@/components/ui/sparql-fetcher';
import {debounce} from "lodash"

type Module = {
    uuid: string;
    id: number;
    code: string;
    name: string;
    semesters: number[];
    ects: number;
    prerequisites: string[];
    prerequisiteNames: string[];
    subjectArea: string[];
    assessment?: string[];
    examDuration?: number[];
    examDistribution?: string[];
    assessmentForm?: string[];
    lecturer?: string[];
    personInCharge?: string[];
    offeredIn?: string[];
    literature?: string[];
    workloadPerson?: number[];
    workloadSelf?: number[];
    furtherModule?: string[];
    additionalPrereqList?: string[];
};

type SubjectAreaRequirement = {
    name: string;
    minCredits: number;
    maxCredits: number;
};

/**
 * Normalizes names to ensure consistency.
 * @param name - The raw name.
 * @returns The normalized name.
 */
function normalizeName(name: string): string {
    return name.trim().toLowerCase().replace(/_/g, ' ').replace(/\s+/g, ' ');
}

export const ModulePlanner = () => {
    const [modules, setModules] = useState<Module[]>([]);
    const [selectedModules, setSelectedModules] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [openDialog, setOpenDialog] = useState(false);
    const [dialogModules, setDialogModules] = useState<Module[]>([]);
    const [moduleToDeselect, setModuleToDeselect] = useState<Module | null>(null);
    const [hideUnfulfilled, setHideUnfulfilled] = useState(false);
    const [availableSemesters, setAvailableSemesters] = useState<number[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [numberOfSemesters, setNumberOfSemesters] = useState<number>(6); // Default to 6 semesters
    const [firstSemesterType, setFirstSemesterType] = useState<'FSS' | 'HWS'>('FSS');
    const [studyPrograms, setStudyPrograms] = useState<StudyProgram[]>([]);
    const [isFirstLoad, setIsFirstLoad] = useState<boolean>(true);
    const [selectedStudyProgramUri, setSelectedStudyProgramUri] = useState<string>('');
    const [studyRequirements, setStudyRequirements] = useState<SubjectAreaRequirement[]>([]);

    // State for layout
    const [layout, setLayout] = useState<string>('landscape'); // Default to 'landscape'

    // State for the View Dialog
    const [isViewDialogOpen, setIsViewDialogOpen] = useState<boolean>(false);

    useEffect(() => {
        fetchStudyPrograms();
    }, []);

    useEffect(() => {
        if (isFirstLoad) {
            setIsViewDialogOpen(true);
            setIsFirstLoad(false);
        }
    }, [isFirstLoad]);

    useEffect(() => {
        if (selectedStudyProgramUri) {
            fetchModuleData();
            fetchStudyRequirements();
        }
    }, [selectedStudyProgramUri, numberOfSemesters, firstSemesterType]);

    useEffect(() => {
        const storedSelectedModules = localStorage.getItem('selectedModules');
        if (storedSelectedModules) {
            setSelectedModules(JSON.parse(storedSelectedModules));
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('selectedModules', JSON.stringify(selectedModules));
    }, [selectedModules]);

    const fetchStudyPrograms = async () => {
        try {
            const programs = await getStudyPrograms();
            setStudyPrograms(programs);
            if (programs.length > 0) {
                setSelectedStudyProgramUri(programs[0].uri); // Set default selected program
            }
        } catch (error) {
            console.error('Error fetching study programs:', error);
        }
    };

    /**
     * Determines the semester type (FSS/HWS) based on the first semester type and semester number.
     * @param semesterNumber - The semester number.
     * @returns 'FSS' for Winter Semester or 'HWS' for Summer Semester.
     */
    const getSemesterType = (semesterNumber: number): 'FSS' | 'HWS' => {
        const types: ('FSS' | 'HWS')[] = ['FSS', 'HWS'];
        const startIndex = firstSemesterType === 'FSS' ? 0 : 1;
        return types[(startIndex + semesterNumber - 1) % 2];
    };

    /**
     * Fetches module data and maps it to the Module type.
     */
    const fetchModuleData = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const bindings: ModuleBinding[] = await getModules(selectedStudyProgramUri);

            // Transform SPARQL results into Module type
            const modulesWithUUID: Module[] = bindings.map(binding => ({
                uuid: uuidv4(),
                id: binding.ids.length > 0 ? parseInt(binding.ids[0], 10) : 0,
                code: binding.module.split('/').pop() || '',
                name:
                    binding.names && binding.names.length > 0
                        ? binding.names.join(', ')
                        : binding.labels && binding.labels.length > 0
                            ? binding.labels.join(', ')
                            : 'Unnamed Module',
                semesters: binding.recSemesterLabels.length > 0 ? binding.recSemesterLabels : [],
                prerequisites: binding.prereqUris || [],          // Use prerequisite URIs
                prerequisiteNames: binding.prereqLabels || [],    // Names of prerequisites
                subjectArea: binding.studyAreaLabels || [],
                ects: binding.ectsLabels.length > 0 ? binding.ectsLabels[0] : 0,
                examDuration: binding.examDurationLabels,
                examDistribution: binding.examDistLabels,
                assessmentForm: binding.assessmentFormLabels,
                lecturer: binding.lecturerLabels,
                personInCharge: binding.personInChargeLabels,
                offeredIn: binding.offeredInLabels,
                literature: binding.recLiteratureLabels,
                workloadPerson: binding.workloadInPersonLabels,
                workloadSelf: binding.workloadSelfStudyLabels,
                furtherModule: binding.furtherModuleLabels,
                additionalPrereqList: binding.additionalPrereqLabels
            }));

            // Assign modules without specified semesters to all semesters up to numberOfSemesters
            const processedModules: Module[] = modulesWithUUID.flatMap(module => {
                if (module.semesters.length === 0) {
                    // Assign to all semesters
                    return Array.from({length: numberOfSemesters}, (_, i) => ({
                        ...module,
                        uuid: uuidv4(),
                        semesters: [i + 1], // Semesters start at 1
                    }));
                } else {
                    return module;
                }
            });

            // Determine unique semesters based on user input
            const allSemesters = Array.from({length: numberOfSemesters}, (_, i) => i + 1);

            setAvailableSemesters(allSemesters);
            setModules(processedModules);
        } catch (error) {
            console.error('Error fetching module data:', error);
            setError('Failed to load modules. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Fetches study requirements based on the selected study program.
     */
    const fetchStudyRequirements = async () => {
        try {
            const requirements = await getStudyRequirements(selectedStudyProgramUri);
            if (requirements.length > 0) {
                const formattedRequirements = requirements.map(req => ({
                    name: req.label,
                    minCredits: req.minEcts,
                    maxCredits: req.maxEcts,
                }));
                setStudyRequirements(formattedRequirements);
            } else {
                setStudyRequirements([]);
            }
        } catch (error) {
            console.error('Error fetching study requirements:', error);
            setStudyRequirements([]);
        }
    };

    /**
     * Calculates progress for each subject area based on selected modules.
     * @returns A map with subject area names as keys and accumulated ECTS as values.
     */
    const calculateSubjectAreaProgress = () => {
        const progress = new Map<string, number>();

        // Initialize all subject areas with 0 credits
        studyRequirements.forEach(area => {
            const normalizedAreaName = normalizeName(area.name);
            progress.set(normalizedAreaName, 0);
        });

        // Calculate total ECTS per subject area from selected modules
        selectedModules.forEach(uuid => {
            const module = modules.find(m => m.uuid === uuid);
            if (module) {
                module.subjectArea.forEach(area => {
                    const normalizedArea = normalizeName(area);
                    if (progress.has(normalizedArea)) {
                        const currentCredits = progress.get(normalizedArea) || 0;
                        progress.set(normalizedArea, currentCredits + module.ects);
                    } else {
                        console.warn(`Subject area "${normalizedArea}" not defined in requirements.`);
                    }
                });
            }
        });

        return progress;
    };

    /**
     * Checks if a module is selected in another semester.
     * @param module - The module to check.
     * @returns True if the module is selected elsewhere, false otherwise.
     */
    const isModuleSelectedElsewhere = (module: Module): boolean => {
        return modules.some(m =>
            selectedModules.includes(m.uuid) && // is selected
            m.code === module.code && // same module code
            m.uuid !== module.uuid // different instance
        );
    };

    /**
     * Checks if all prerequisites for a module are fulfilled.
     * @param module - The module to check.
     * @param currentSemester - The semester in which the module is being taken.
     * @returns True if all prerequisites are fulfilled, false otherwise.
     */
    const arePrerequisitesFulfilled = (module: Module, currentSemester: number): boolean => {
        return module.prerequisites.every(prereqUri => {
            const extractedPrereqCode = prereqUri.split('/').pop() || prereqUri;
            const selectedPrereq = modules.find(m =>
                m.code === extractedPrereqCode &&
                selectedModules.includes(m.uuid) &&
                Math.min(...m.semesters) < currentSemester // Must be in earlier semester
            );
            return !!selectedPrereq;
        });
    };

    /**
     * Handles the selection or deselection of a module.
     * @param moduleUuid - The UUID of the module to select/deselect.
     */
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
                alert('Prerequisites are not fulfilled for this module.');
                return;
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

    /**
     * Retrieves all modules that depend on the specified module.
     * @param moduleUuid - The UUID of the module.
     * @returns An array of dependent modules.
     */
    const getDependentModules = (moduleUuid: string): Module[] => {
        const selectedModule = modules.find(module => module.uuid === moduleUuid);
        if (!selectedModule) return [];

        const dependentModules: Module[] = [];

        const traverseDependencies = (module: Module) => {
            const directDependents = modules.filter(m =>
                m.prerequisites.some(prereqUri => {
                    const extractedPrereqCode = prereqUri.split('/').pop() || prereqUri;
                    return extractedPrereqCode === module.code;
                }) && selectedModules.includes(m.uuid)
            );

            dependentModules.push(...directDependents);

            directDependents.forEach(dependent => {
                traverseDependencies(dependent);
            });
        };

        traverseDependencies(selectedModule);

        return dependentModules;
    };

    /**
     * Deselects a module and recursively deselects its dependent modules.
     * @param moduleUuid - The UUID of the module to deselect.
     */
    const deselectModule = (moduleUuid: string) => {
        setSelectedModules(prev => prev.filter(uuid => uuid !== moduleUuid));

        const deselectedModule = modules.find(module => module.uuid === moduleUuid);
        if (!deselectedModule) return;

        const dependentModules = getDependentModules(moduleUuid);
        dependentModules.forEach(module => {
            deselectModule(module.uuid);
        });
    };

    /**
     * Confirms the deselection of a module and its dependents.
     */
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

    /**
     * Checks if a module is selected.
     * @param moduleUuid - The UUID of the module.
     * @returns True if the module is selected, false otherwise.
     */
    const isModuleSelected = (moduleUuid: string) =>
        selectedModules.includes(moduleUuid);

    /**
     * Retrieves the codes of all selected modules.
     */
    const selectedModuleCodes = useMemo(() => {
        return modules
            .filter(m => selectedModules.includes(m.uuid))
            .map(m => m.code);
    }, [modules, selectedModules]);

    /**
     * Handles changes in the search input.
     * @param e - The change event.
     */
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    /**
     * Handles changes in the number of semesters.
     * @param value - The new number of semesters.
     */
    const handleSemesterCountChange = (value: number) => {
        if (!isNaN(value) && value > 0 && value <= 12) {
            setNumberOfSemesters(value);
        }
    };

    /**
     * Handles changes in the layout selection.
     * @param value - The selected layout.
     */
    const handleLayoutChange = (value: string) => {
        setLayout(value);
    };

    /**
     * Handles changes in the "Hide Unfulfilled" checkbox.
     * @param checked - Whether the checkbox is checked.
     */
    const handleHideUnfulfilledChange = (checked: boolean) => {
        setHideUnfulfilled(checked);
    };

    /**
     * Handles changes in the semester type selection (FSS/HWS).
     * @param value - The selected semester type.
     */
    const handleSemesterTypeChange = (value: 'FSS' | 'HWS') => {
        setFirstSemesterType(value);
    };

    /**
     * Debounced search term to optimize performance.
     */
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>(searchTerm);

    useEffect(() => {
        const handler = debounce(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 300); // 300ms debounce delay

        handler();

        return () => {
            handler.cancel();
        };
    }, [searchTerm]);

    /**
     * Filters modules based on debounced search term and "Hide Unfulfilled" option.
     */
    const filteredModules = useMemo(() => {
        let filtered = modules;

        if (debouncedSearchTerm.trim()) {
            const lowerSearch = debouncedSearchTerm.toLowerCase();
            filtered = filtered.filter(
                module =>
                    module.name.toLowerCase().includes(lowerSearch) ||
                    module.code.toLowerCase().includes(lowerSearch) ||
                    module.subjectArea.some(area => area.toLowerCase().includes(lowerSearch))
            );
        }

        if (hideUnfulfilled) {
            filtered = filtered.filter(module => {
                const currentSemester = Math.min(...module.semesters);
                const fulfilled = arePrerequisitesFulfilled(module, currentSemester);
                const isSelectedElsewhere = isModuleSelectedElsewhere(module);
                return fulfilled && !isSelectedElsewhere;
            });
        }

        return filtered;
    }, [modules, debouncedSearchTerm, hideUnfulfilled, selectedModules]);

    /**
     * Renders the progress drawer showing progress in each subject area.
     */
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
                    {studyRequirements.length > 0 ? (
                        studyRequirements.map(area => {
                            const normalizedAreaName = normalizeName(area.name);
                            const currentCredits = progress.get(normalizedAreaName) || 0;
                            const progressPercentage = area.maxCredits > 0
                                ? Math.min(
                                    100,
                                    (currentCredits / area.maxCredits) * 100
                                )
                                : 0;

                            const isOutOfLimits =
                                currentCredits < area.minCredits || currentCredits > area.maxCredits;

                            return (
                                <div key={area.name} className="flex items-center space-x-4">
                                    <div className="w-32">
                                        <span className="text-sm font-medium">{area.name}</span>
                                    </div>
                                    <ProgressBar
                                        percentage={progressPercentage}
                                        isOutOfLimits={isOutOfLimits}
                                        minCredits={area.minCredits}
                                        maxCredits={area.maxCredits}
                                        currentCredits={currentCredits}
                                    />
                                </div>
                            );
                        })
                    ) : (
                        <p>No Study Requirements</p>
                    )}
                </div>
                <DrawerFooter>
                    <DrawerClose asChild>
                        <Button variant="outline">Close</Button>
                    </DrawerClose>
                </DrawerFooter>
            </DrawerContent>
        );
    };

    /**
     * Renders the semester columns based on the selected layout.
     */
    const renderSemesterColumns = () => {
        if (layout === 'landscape') {
            // Single column layout (1 × X)
            return (
                <div className="flex flex-col gap-4 w-full">
                    {availableSemesters.map((semester) => {
                        const modulesForSemester = filteredModules.filter(module => module.semesters.includes(semester));
                        const semesterType = getSemesterType(semester);
                        return (
                            <Card key={semester} className="w-full max-w-none mx-0">
                                <CardHeader>
                                    <CardTitle>Semester {semester} ({semesterType})</CardTitle> {/* Adding semester type */}
                                </CardHeader>
                                <CardContent>
                                    <div
                                        className="grid gap-2 w-full"
                                        style={{
                                            gridTemplateColumns: `repeat(auto-fill, minmax(150px, 1fr))`,
                                        }}
                                    >
                                        {modulesForSemester.map(module => (
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
                        );
                    })}
                </div>
            );
        } else {
            // Grid layouts (2 × X to 6 × X)
            const columns = parseInt(layout.split('x')[0], 10) || 1;
            const gridStyle = {
                display: 'grid',
                gridTemplateColumns: `repeat(${columns}, minmax(200px, 1fr))`,
                gap: '1rem',
            };

            return (
                <div style={gridStyle} className="w-full">
                    {availableSemesters.map((semester) => {
                        const modulesForSemester = filteredModules.filter(module => module.semesters.includes(semester));
                        const semesterType = getSemesterType(semester);
                        return (
                            <Card key={semester} className="w-full max-w-none mx-0">
                                <CardHeader>
                                    <CardTitle>Semester {semester} ({semesterType})</CardTitle> {/* Adding semester type */}
                                </CardHeader>
                                <CardContent>
                                    <div
                                        className="grid gap-2 w-full"
                                        style={{
                                            gridTemplateColumns: `repeat(auto-fill, minmax(150px, 1fr))`,
                                        }}
                                    >
                                        {modulesForSemester.map(module => (
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
                        );
                    })}
                </div>
            );
        }
    };

    return (
        <div className="w-full mx-auto p-4 overflow-x-hidden">
            <h1 className="text-4xl font-bold mb-4">Module Planner</h1>
            <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={handleSearchChange}
                        placeholder="Search modules by name, code, or study area..."
                        className="w-full sm:w-80 p-2 border border-gray-300 rounded-md"
                    />
                </div>
                {/* View Button */}
                <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline">View</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px] bg-white shadow-lg rounded-lg">
                        <DialogHeader>
                            <DialogTitle>View Settings</DialogTitle>
                            <DialogDescription>
                                Customize the layout and total number of semesters.
                            </DialogDescription>
                        </DialogHeader>
                        {/* Study Program Selection */}
                        <div className="flex items-center gap-2">
                            <label htmlFor="studyProgram" className="text-sm font-bold">
                                Study Program:
                            </label>
                            <select
                                id="studyProgram"
                                value={selectedStudyProgramUri}
                                onChange={(e) => setSelectedStudyProgramUri(e.target.value)}
                                className="p-2 border border-gray-300 rounded-md"
                            >
                                {studyPrograms.map(program => (
                                    <option key={program.uri} value={program.uri}>
                                        {program.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-4 p-4">
                            {/* Number of Semesters */}
                            <div className="flex items-center gap-2">
                                <label htmlFor="semesterCount" className="text-sm font-bold">
                                    Total Number of Semesters:
                                </label>
                                <input
                                    type="number"
                                    id="semesterCount"
                                    min="1"
                                    max="12"
                                    value={numberOfSemesters}
                                    onChange={(e) => handleSemesterCountChange(parseInt(e.target.value, 10))}
                                    className="w-16 p-2 border border-gray-300 rounded-md"
                                    title="Specify the total number of semesters"
                                />
                            </div>
                            {/* Semester Type Selection */}
                            <div className="flex items-center gap-2">
                                <label htmlFor="semesterType" className="text-sm font-bold">
                                    First Semester Type:
                                </label>
                                <select
                                    id="semesterType"
                                    value={firstSemesterType}
                                    onChange={(e) => handleSemesterTypeChange(e.target.value as 'FSS' | 'HWS')}
                                    className="p-2 border border-gray-300 rounded-md"
                                >
                                    <option value="FSS">Winter Semester (FSS)</option>
                                    <option value="HWS">Summer Semester (HWS)</option>
                                </select>
                            </div>
                            {/* Layout Selection */}
                            <div>
                                <label className="text-sm font-bold">Layout:</label>
                                <RadioGroup value={layout} onValueChange={handleLayoutChange}
                                            className="mt-2 space-y-2">
                                    <div className="flex items-center">
                                        <RadioGroupItem value="landscape" id="layout-landscape"/>
                                        <label htmlFor="layout-landscape" className="ml-2">
                                            Landscape (1 × X)
                                        </label>
                                    </div>
                                    <div className="flex items-center">
                                        <RadioGroupItem value="2x" id="layout-2x"/>
                                        <label htmlFor="layout-2x" className="ml-2">
                                            2 × X
                                        </label>
                                    </div>
                                    <div className="flex items-center">
                                        <RadioGroupItem value="3x" id="layout-3x"/>
                                        <label htmlFor="layout-3x" className="ml-2">
                                            3 × X
                                        </label>
                                    </div>
                                    <div className="flex items-center">
                                        <RadioGroupItem value="4x" id="layout-4x"/>
                                        <label htmlFor="layout-4x" className="ml-2">
                                            4 × X
                                        </label>
                                    </div>
                                    <div className="flex items-center">
                                        <RadioGroupItem value="5x" id="layout-5x"/>
                                        <label htmlFor="layout-5x" className="ml-2">
                                            5 × X
                                        </label>
                                    </div>
                                    <div className="flex items-center">
                                        <RadioGroupItem value="6x" id="layout-6x"/>
                                        <label htmlFor="layout-6x" className="ml-2">
                                            6 × X
                                        </label>
                                    </div>
                                </RadioGroup>
                            </div>
                            {/* Hide Modules Checkbox */}
                            <div className="flex items-center">
                                <Checkbox
                                    id="hideUnfulfilled"
                                    checked={hideUnfulfilled}
                                    onCheckedChange={handleHideUnfulfilledChange}
                                />
                                <label htmlFor="hideUnfulfilled" className="ml-2 text-sm font-bold">
                                    Hide modules with unfulfilled prerequisites
                                </label>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={() => setIsViewDialogOpen(false)}>Close</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {isLoading ? (
                <p>Loading modules...</p>
            ) : error ? (
                <p className="text-red-500">{error}</p>
            ) : (
                renderSemesterColumns()
            )}

            {/* Confirmation Dialog for Deselecting Modules */}
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

            {/* Progress Drawer */}
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
