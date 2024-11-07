'use strict ';

import React, {useState, useEffect} from 'react';
import {Card, CardHeader, CardTitle, CardContent} from '@/components/ui/card';

type Module = {
    id: number;
    name: string;
    semester: number;
    ects: number;
    prerequisites: number[];
};

const moduleColors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-red-500',
    'bg-purple-500',
    // Add more colors as needed
];

export const ModulePlanner = () => {
    const [modules, setModules] = useState<Module[]>([]);
    const [selectedModules, setSelectedModules] = useState<number[]>([]);

    useEffect(() => {
        // Fetch module data from the API
        fetchModuleData();
    }, []);

    const fetchModuleData = async () => {
        // Make an API call to retrieve module data from the knowledge graph
        // Update the 'modules' state with the fetched data
        // For now, you can use placeholder data
        const placeholderData: Module[] = [
            {id: 1, name: 'Introduction to Programming', semester: 1, ects: 5, prerequisites: []},
            {id: 2, name: 'Mathematics I', semester: 1, ects: 6, prerequisites: []},
            {id: 3, name: 'Web Development Basics', semester: 1, ects: 4, prerequisites: []},
            {id: 4, name: 'Database Systems', semester: 2, ects: 5, prerequisites: [1]},
            {id: 5, name: 'Software Engineering', semester: 2, ects: 6, prerequisites: [1]},
            {id: 6, name: 'Mathematics II', semester: 2, ects: 6, prerequisites: [2]},
            {id: 1, name: 'Introduction to Programming', semester: 3, ects: 5, prerequisites: []},
            {id: 3, name: 'Web Development Basics', semester: 3, ects: 4, prerequisites: []},
            {id: 7, name: 'Algorithms and Data Structures', semester: 3, ects: 6, prerequisites: [1, 2]},
            {id: 8, name: 'Operating Systems', semester: 3, ects: 5, prerequisites: [1]},
            {id: 9, name: 'Computer Networks', semester: 4, ects: 5, prerequisites: [1]},
            {id: 10, name: 'Artificial Intelligence', semester: 4, ects: 6, prerequisites: [7]},
            {id: 11, name: 'Software Testing', semester: 4, ects: 4, prerequisites: [5]},
            {id: 4, name: 'Database Systems', semester: 5, ects: 5, prerequisites: [1]},
            {id: 12, name: 'Mobile App Development', semester: 5, ects: 6, prerequisites: [1, 3]},
            {id: 13, name: 'Web Application Security', semester: 5, ects: 5, prerequisites: [3, 4]},
            {id: 14, name: 'Data Mining', semester: 6, ects: 6, prerequisites: [4, 7]},
            {id: 15, name: 'Machine Learning', semester: 6, ects: 6, prerequisites: [7, 10]},
            {id: 16, name: 'Software Project Management', semester: 6, ects: 4, prerequisites: [5, 11]},
        ];
        setModules(placeholderData);
    };

    const handleModuleSelection = (moduleId: number) => {
        setSelectedModules((prevSelected) =>
            prevSelected.includes(moduleId)
                ? prevSelected.filter((id) => id !== moduleId)
                : [...prevSelected, moduleId]
        );
    };

    const getModuleColor = (moduleId: number) => {
    const isSelected = selectedModules.includes(moduleId);
    const hue = (moduleId * 137.508) % 360; // Golden angle approximation for better color distribution
    const saturation = 70; // 70% saturation for pastel softness
    const lightness = isSelected ? 0 : 69; // 0% lightness for selected (black), 69% for unselected
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

    const renderSemesterColumns = () => {
        const semesters = [...new Set(modules.map((module) => module.semester))];
        const numberOfSemesters = semesters.length;

        return (
            <div
                className="grid gap-4"
                style={{
                    gridTemplateColumns: `repeat(${numberOfSemesters}, minmax(200px, 1fr))`,
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
                                    .map((module) => (
                                        <div
                                            key={`${module.id}-${module.semester}`}
                                            onClick={() => handleModuleSelection(module.id)} // Optional: Add click handler
                                            style={{backgroundColor: getModuleColor(module.id)}}
                                            className={`p-4 rounded-md text-white cursor-pointer hover:opacity-90 transition-opacity duration-200`}
                                        >
                                            {module.name}
                                        </div>
                                    ))}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    };


    return (
        <div className="container mx-auto p-4 max-w-10xl">
            <h2 className="text-2xl font-bold mb-4">Module Planner</h2>
            {renderSemesterColumns()}
        </div>
    );
};