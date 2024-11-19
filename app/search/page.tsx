// pages/search.tsx

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ModuleCard } from '@/components/ui/module-card';
import { getAllModules, ModuleBinding } from '@/components/ui/sparql-fetcher';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/button';

type Module = {
    uuid: string;
    id: number;
    code: string;
    name: string;
    ects: number;
    // ... other properties as needed
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
    prerequisites: string[];
    prerequisiteNames: string[];
    subjectArea: string[];
    additionalPrereqList?: string[];
};

const SearchPage: React.FC = () => {
    const [modules, setModules] = useState<Module[]>([]);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchAllModules();
    }, []);

    /**
     * Fetches all modules from the SPARQL endpoint.
     */
    const fetchAllModules = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const bindings: ModuleBinding[] = await getAllModules();
            const modulesData: Module[] = bindings.map(binding => ({
                uuid: uuidv4(),
                id: binding.ids.length > 0 ? parseInt(binding.ids[0], 10) : 0,
                code: binding.module.split('/').pop() || '',
                name:
                    binding.names && binding.names.length > 0
                        ? binding.names.join(', ')
                        : binding.labels && binding.labels.length > 0
                            ? binding.labels.join(', ')
                            : 'Unnamed Module',
                ects: binding.ectsLabels.length > 0 ? binding.ectsLabels[0] : 0,
                prerequisites: binding.prereqUris || [],
                prerequisiteNames: binding.prereqLabels || [],
                subjectArea: binding.studyAreaLabels || [],
                assessment: binding.assessmentLabels,
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
                additionalPrereqList: binding.additionalPrereqLabels,
            }));
            setModules(modulesData);
        } catch (err) {
            console.error('Error fetching all modules:', err);
            setError('Failed to load modules. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Handles changes in the search input.
     * @param e - The change event.
     */
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    /**
     * Filters modules based on the search term.
     */
    const filteredModules = useMemo(() => {
        if (!searchTerm.trim()) {
            return modules;
        }
        const lowerSearch = searchTerm.toLowerCase();
        return modules.filter(module =>
            module.name.toLowerCase().includes(lowerSearch) ||
            module.code.toLowerCase().includes(lowerSearch) ||
            module.subjectArea.some(area => area.toLowerCase().includes(lowerSearch))
        );
    }, [modules, searchTerm]);

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold mb-6">Module Search</h1>
            <div className="mb-4">
                <input
                    type="text"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    placeholder="Search modules by name, code, or study area..."
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="Search modules"
                />
            </div>
            {isLoading ? (
                <p>Loading modules...</p>
            ) : error ? (
                <p className="text-red-500">{error}</p>
            ) : (
                <>
                    {filteredModules.length === 0 ? (
                        <p>No modules found matching your search criteria.</p>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {filteredModules.map(module => (
                                <ModuleCard
                                    key={module.uuid}
                                    module={module}
                                    isSelected={false} // Selection not needed on search page
                                    onSelect={() => {}} // No action on select
                                    selectedModuleCodes={[]} // Not applicable
                                    selectedElsewhere={false} // Not applicable
                                    currentSemester={0} // Not applicable
                                    allModules={modules} // Provide all modules for prerequisite checks if needed
                                    selectedModules={[]} // Not applicable
                                />
                            ))}
                        </div>
                    )}
                </>
            )}
            {/* Optional: Add a button to navigate back to the planner */}
            <div className="mt-6 flex justify-center">
                <Button variant="outline" onClick={() => window.history.back()}>
                    Back to Planner
                </Button>
            </div>
        </div>
    );
};

export default SearchPage;
