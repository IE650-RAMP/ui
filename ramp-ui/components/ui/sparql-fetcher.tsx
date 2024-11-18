// sparql-fetcher.ts

import NodeCache from 'node-cache';

// Updated type definitions
export type ModuleBinding = {
    module: string;
    ids: string[];
    names: string[];
    labels: string[];
    studyAreaLabels: string[];
    studyProgramLabels: string[];
    prereqUris: string[];           // Added prerequisite URIs
    prereqLabels: string[];
    additionalPrereqLabels?: string[];
    ectsLabels: number[];
    examDurationLabels?: number[];
    assessmentLabels?: string[];
    lecturerLabels?: string[];
    personInChargeLabels?: string[];
    offeredInLabels?: string[];
    recLiteratureLabels?: string[];
    recSemesterLabels: number[];
    workloadInPersonLabels?: number[];
    workloadSelfStudyLabels?: number[];
    furtherModuleLabels?: string[];
    hasPrereqLabels?: string[];
    hasModuleLabels?: string[];
    examDistLabels?: string[];
    assessmentFormLabels?: string[];
};

const cache = new NodeCache({ stdTTL: 3600 }); // Cache with 1-hour TTL

/**
 * Splits a concatenated string into an array, handling empty or undefined values.
 * @param value - The concatenated string.
 * @returns An array of strings.
 */
function splitValues(value?: { value: string }): string[] {
    if (!value || !value.value || value.value.trim() === '') {
        return [];
    }
    return value.value.split('|').filter((v) => v.trim() !== '');
}

/**
 * Parses a concatenated string of numbers into an array of numbers.
 * @param value - The concatenated string.
 * @returns An array of numbers.
 */
function parseNumberList(value?: { value: string }): number[] {
    return splitValues(value).map(Number).filter((n) => !isNaN(n));
}

/**
 * Formats a module name by replacing underscores with spaces and capitalizing each word's first letter.
 * @param name - The raw module name string.
 * @returns The formatted module name.
 */
function formatModuleName(name: string): string {
    return name
        .replace(/_/g, ' ') // Replace underscores with spaces
        .split(' ') // Split into words
        .map((word) => {
            if (word.length === 0) return word; // Handle empty strings
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(); // Capitalize first letter
        })
        .join(' '); // Rejoin into a single string
}

/**
 * Normalizes names to ensure consistency.
 * @param name - The raw name.
 * @returns The normalized name.
 */
function normalizeName(name: string): string {
    return name.trim().toLowerCase().replace(/_/g, ' ');
}

/**
 * Fetches module data from the Next.js API proxy.
 * Implements caching to reduce redundant network requests.
 * @returns Promise resolving to an array of ModuleBinding objects.
 */
export async function getModules(): Promise<ModuleBinding[]> {
    const cacheKey = 'modulesData';
    const cachedData = cache.get<ModuleBinding[]>(cacheKey);
    if (cachedData) {
        console.log('Returning cached module data.');
        return cachedData;
    }

    const query = `
        PREFIX ramp: <http://ramp.uni-mannheim.de/>
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        SELECT DISTINCT ?module
            (GROUP_CONCAT(DISTINCT ?idLabel; separator="|") as ?ids)
            (GROUP_CONCAT(DISTINCT ?nameLabel; separator="|") as ?names)
            (GROUP_CONCAT(DISTINCT ?label; separator="|") as ?labels)
            (GROUP_CONCAT(DISTINCT ?studyAreaLabel; separator="|") as ?studyAreaLabels)
            (GROUP_CONCAT(DISTINCT ?studyProgramLabel; separator="|") as ?studyProgramLabels)
            (GROUP_CONCAT(DISTINCT STR(?prereq); separator="|") as ?prereqUris)
            (GROUP_CONCAT(DISTINCT ?prereqLabel; separator="|") as ?prereqLabels)
            (GROUP_CONCAT(DISTINCT ?additionalPrereqLabel; separator="|") as ?additionalPrereqLabels)
            (GROUP_CONCAT(DISTINCT ?ectsLabel; separator="|") as ?ectsLabels)
            (GROUP_CONCAT(DISTINCT ?examDurationLabel; separator="|") as ?examDurationLabels)
            (GROUP_CONCAT(DISTINCT ?assessmentLabel; separator="|") as ?assessmentLabels)
            (GROUP_CONCAT(DISTINCT ?lecturerLabel; separator="|") as ?lecturerLabels)
            (GROUP_CONCAT(DISTINCT ?personInChargeLabel; separator="|") as ?personInChargeLabels)
            (GROUP_CONCAT(DISTINCT ?offeredInLabel; separator="|") as ?offeredInLabels)
            (GROUP_CONCAT(DISTINCT ?recLiteratureLabel; separator="|") as ?recLiteratureLabels)
            (GROUP_CONCAT(DISTINCT ?recSemesterLabel; separator="|") as ?recSemesterLabels)
            (GROUP_CONCAT(DISTINCT ?workloadInPersonLabel; separator="|") as ?workloadInPersonLabels)
            (GROUP_CONCAT(DISTINCT ?workloadSelfStudyLabel; separator="|") as ?workloadSelfStudyLabels)
            (GROUP_CONCAT(DISTINCT ?furtherModuleLabel; separator="|") as ?furtherModuleLabels)
            (GROUP_CONCAT(DISTINCT ?hasPrereqLabel; separator="|") as ?hasPrereqLabels)
            (GROUP_CONCAT(DISTINCT ?hasModuleLabel; separator="|") as ?hasModuleLabels)
            (GROUP_CONCAT(DISTINCT ?examDistLabel; separator="|") as ?examDistLabels)
            (GROUP_CONCAT(DISTINCT ?assessmentFormLabel; separator="|") as ?assessmentFormLabels)
        WHERE {
            ?module rdf:type ramp:Module .
            FILTER (STRSTARTS(STR(?module), "http://ramp.uni-mannheim.de/module/"))
            OPTIONAL { ?module ramp:id ?id . ?id rdfs:label ?idLabel }
            OPTIONAL { ?module ramp:name ?nameLabel }  # Adjusted here
            OPTIONAL { ?module rdfs:label ?label }     # Include rdfs:label
            OPTIONAL { 
                ?module ramp:isModuleOf ?studyArea .
                ?studyArea rdf:type ramp:StudyArea .
                ?studyArea rdfs:label ?studyAreaLabel
            }
            OPTIONAL {
                ?module ramp:isModuleOf ?studyProgram .
                ?studyProgram rdf:type ramp:StudyProgram .
                ?studyProgram rdfs:label ?studyProgramLabel
            }
            OPTIONAL { ?module ramp:hasPrerequisite ?prereq . ?prereq rdfs:label ?prereqLabel }
            OPTIONAL { ?module ramp:additionalPrerequisite ?additionalPrereq . ?additionalPrereq rdfs:label ?additionalPrereqLabel }
            OPTIONAL { ?module ramp:ects ?ects . ?ects rdfs:label ?ectsLabel }
            OPTIONAL { ?module ramp:examinationDuration ?examDuration . ?examDuration rdfs:label ?examDurationLabel }
            OPTIONAL { ?module ramp:hasAssesment ?assessment . ?assessment rdfs:label ?assessmentLabel }
            OPTIONAL { ?module ramp:hasLecturer ?lecturer . ?lecturer rdfs:label ?lecturerLabel }
            OPTIONAL { ?module ramp:hasPersonInCharge ?personInCharge . ?personInCharge rdfs:label ?personInChargeLabel }
            OPTIONAL { ?module ramp:offeredIn ?offeredIn . ?offeredIn rdfs:label ?offeredInLabel }
            OPTIONAL { ?module ramp:recommendedLiterature ?recLiterature . ?recLiterature rdfs:label ?recLiteratureLabel }
            OPTIONAL { ?module ramp:recommendedSemester ?recSemester . ?recSemester rdfs:label ?recSemesterLabel }
            OPTIONAL { ?module ramp:workloadInPerson ?workloadInPerson . ?workloadInPerson rdfs:label ?workloadInPersonLabel }
            OPTIONAL { ?module ramp:workloadSelfStudy ?workloadSelfStudy . ?workloadSelfStudy rdfs:label ?workloadSelfStudyLabel }
            OPTIONAL { ?module ramp:hasFurtherModule ?furtherModule . ?furtherModule rdfs:label ?furtherModuleLabel }
            OPTIONAL { ?module ramp:hasPrerequisite ?hasPrereq . ?hasPrereq rdfs:label ?hasPrereqLabel }
            OPTIONAL { ?module ramp:hasModule ?hasModule . ?hasModule rdfs:label ?hasModuleLabel }
            OPTIONAL { ?module ramp:examinationDistribution ?examDist . ?examDist rdfs:label ?examDistLabel }
            OPTIONAL { ?module ramp:hasAssessmentForm ?assessmentForm . ?assessmentForm rdfs:label ?assessmentFormLabel }
        }
        GROUP BY ?module
    `;

    try {
        const response = await fetch('/api/sparql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('SPARQL query failed:', errorData.error || response.statusText);
            throw new Error(`SPARQL query failed: ${errorData.error || response.statusText}`);
        }

        const data = await response.json();

        console.log('SPARQL Response:', JSON.stringify(data, null, 2));

        // Parse the SPARQL JSON response into ModuleBinding[]
        const bindings: ModuleBinding[] = data.results.bindings.map((binding: any) => {
            return {
                module: binding.module.value,
                ids: splitValues(binding.ids),
                names: splitValues(binding.names).map(formatModuleName),
                labels: splitValues(binding.labels).map(formatModuleName),
                studyAreaLabels: splitValues(binding.studyAreaLabels).map(formatModuleName),
                studyProgramLabels: splitValues(binding.studyProgramLabels).map(formatModuleName),
                prereqUris: splitValues(binding.prereqUris),
                prereqLabels: splitValues(binding.prereqLabels).map(formatModuleName),
                additionalPrereqLabels: splitValues(binding.additionalPrereqLabels),
                ectsLabels: parseNumberList(binding.ectsLabels),
                examDurationLabels: parseNumberList(binding.examDurationLabels),
                assessmentLabels: splitValues(binding.assessmentLabels),
                lecturerLabels: splitValues(binding.lecturerLabels),
                personInChargeLabels: splitValues(binding.personInChargeLabels),
                offeredInLabels: splitValues(binding.offeredInLabels),
                recLiteratureLabels: splitValues(binding.recLiteratureLabels),
                recSemesterLabels: parseNumberList(binding.recSemesterLabels),
                workloadInPersonLabels: parseNumberList(binding.workloadInPersonLabels),
                workloadSelfStudyLabels: parseNumberList(binding.workloadSelfStudyLabels),
                furtherModuleLabels: splitValues(binding.furtherModuleLabels),
                hasPrereqLabels: splitValues(binding.hasPrereqLabels),
                hasModuleLabels: splitValues(binding.hasModuleLabels),
                examDistLabels: splitValues(binding.examDistLabels),
                assessmentFormLabels: splitValues(binding.assessmentFormLabels),
            };
        });

        cache.set(cacheKey, bindings);
        return bindings;
    } catch (error) {
        console.error('SPARQL query error:', error);
        throw error; // Ensure this is handled in your React components
    }
}
