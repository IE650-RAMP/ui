// pages/search.tsx

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { SearchModuleCard } from '@/components/ui/searchmodulecard';
import { getAllModules, ModuleBinding } from '@/components/ui/sparql-fetcher';
import { v4 as uuidv4 } from 'uuid';

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

const SearchPage: React.FC = () => {
    const [modules, setModules] = useState<Module[]>([]);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchAllModules();
    }, []);

    /**
     * Fetches all modules without filtering by study program.
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
                semesters: binding.recSemesterLabels.length > 0 ? binding.recSemesterLabels : [],
                ects: binding.ectsLabels.length > 0 ? binding.ectsLabels[0] : 0,
                prerequisites: binding.prereqUris || [],
                prerequisiteNames: binding.prereqLabels || [],
                subjectArea: binding.studyAreaLabels || [],
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
     * Debounced search term to optimize performance.
     */
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>(searchTerm);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 300); // 300ms debounce delay

        return () => {
            clearTimeout(handler);
        };
    }, [searchTerm]);

    /**
     * Filters modules based on debounced search term.
     */
    const filteredModules = useMemo(() => {
        if (debouncedSearchTerm.trim() === '') {
            return modules;
        }

        const lowerSearch = debouncedSearchTerm.toLowerCase();
        return modules.filter(
            module =>
                module.name.toLowerCase().includes(lowerSearch) ||
                module.code.toLowerCase().includes(lowerSearch) ||
                module.subjectArea.some(area => area.toLowerCase().includes(lowerSearch))
        );
    }, [modules, debouncedSearchTerm]);

    return (
        <div className="w-full mx-auto p-4">
            <h1 className="text-4xl font-bold mb-4">Module Search</h1>
            <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full">
                <input
                    type="text"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    placeholder="Search modules by name, code, or subject area..."
                    className="w-full sm:w-80 p-2 border border-gray-300 rounded-md"
                />
            </div>

            {isLoading ? (
                <p>Loading modules...</p>
            ) : error ? (
                <p className="text-red-500">{error}</p>
            ) : filteredModules.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {filteredModules.map(module => (
                        <SearchModuleCard key={module.uuid} module={module} />
                    ))}
                </div>
            ) : (
                <p>No modules found matching your search.</p>
            )}
        </div>
    );
};

export default SearchPage;
