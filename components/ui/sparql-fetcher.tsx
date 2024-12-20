// sparql-fetcher.ts

import NodeCache from 'node-cache';
import fetchSparqlEndpoint from './fetchSparqlEndpoint';

// Utility functions
function splitValues(value?: { value: string }): string[] {
    if (!value || !value.value || value.value.trim() === '') {
        return [];
    }
    return value.value.split('|').filter((v) => v.trim() !== '');
}

function parseNumberList(value?: { value: string }): number[] {
    return splitValues(value).map(Number).filter((n) => !isNaN(n));
}

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

function normalizeName(name: string): string {
    return name.trim().toLowerCase().replace(/_/g, ' ').replace(/\s+/g, ' ');
}

function mapOfferedIn(label: string): 'FSS' | 'HWS' | string {
    const normalized = normalizeName(label);
    if (normalized === 'winter semester') return 'HWS';
    if (normalized === 'summer semester') return 'FSS';
    if (normalized === 'fss') return 'FSS';
    if (normalized === 'hws') return 'HWS';
    return label.toUpperCase(); // Ensure consistency
}

// Define the ModuleBinding type
export type ModuleBinding = {
    module: string;
    ids: string[];
    names: string[];
    labels: string[];
    studyAreaLabels: string[];
    studyProgramLabels: string[];
    prereqUris: string[];
    prereqLabels: string[];
    additionalPrereqLabels?: string[];
    ectsLabels: number[];
    examDurationLabels?: number[];
    examDistLabels?: string[];
    assessmentFormLabels?: string[];
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
};

export type StudyRequirement = {
    uri: string;
    label: string;
    minEcts: number;
    maxEcts: number;
};

export type StudyProgram = {
    uri: string;
    label: string;
};

const cache = new NodeCache({ stdTTL: 3600 }); // Cache with 1-hour TTL

// Implement the getAllModules function
export async function getAllModules(): Promise<ModuleBinding[]> {
    const query = `
        PREFIX ramp: <http://ramp.uni-mannheim.de/>
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

        SELECT DISTINCT ?module
            (GROUP_CONCAT(DISTINCT ?idLabel; separator="|") as ?ids)
            (GROUP_CONCAT(DISTINCT ?nameLabel; separator="|") as ?names)
            (GROUP_CONCAT(DISTINCT ?label; separator="|") as ?labels)
            (GROUP_CONCAT(DISTINCT ?studyAreaLabel; separator="|") as ?studyAreaLabels)
            (GROUP_CONCAT(DISTINCT STR(?prereq); separator="|") as ?prereqUris)
            (GROUP_CONCAT(DISTINCT ?prereqLabel; separator="|") as ?prereqLabels)
            (GROUP_CONCAT(DISTINCT ?additionalPrereqLabel; separator="|") as ?additionalPrereqLabels)
            (GROUP_CONCAT(DISTINCT ?ects; separator="|") as ?ectsLabels)
            (GROUP_CONCAT(DISTINCT ?examDuration; separator="|") as ?examDurationLabels)
            (GROUP_CONCAT(DISTINCT ?assessmentLabel; separator="|") as ?assessmentLabels)
            (GROUP_CONCAT(DISTINCT ?lecturerLabel; separator="|") as ?lecturerLabels)
            (GROUP_CONCAT(DISTINCT ?personInChargeLabel; separator="|") as ?personInChargeLabels)
            (GROUP_CONCAT(DISTINCT ?offeredInLabel; separator="|") as ?offeredInLabels)
            (GROUP_CONCAT(DISTINCT ?recLiteratureLabel; separator="|") as ?recLiteratureLabels)
            (GROUP_CONCAT(DISTINCT ?recSemesterLabel; separator="|") as ?recSemesterLabels)
            (GROUP_CONCAT(DISTINCT ?workloadInPersonLabel; separator="|") as ?workloadInPersonLabels)
            (GROUP_CONCAT(DISTINCT ?workloadSelfStudyLabel; separator="|") as ?workloadSelfStudyLabels)
            (GROUP_CONCAT(DISTINCT ?furtherModuleLabel; separator="|") as ?furtherModuleLabels)
            (GROUP_CONCAT(DISTINCT ?examDistLabel; separator="|") as ?examDistLabels)
            (GROUP_CONCAT(DISTINCT ?assessmentFormLabel; separator="|") as ?assessmentFormLabels)
        WHERE {
            ?module rdf:type ramp:Module .
            FILTER (STRSTARTS(STR(?module), "http://ramp.uni-mannheim.de/module/"))
            OPTIONAL { ?module ramp:id ?id . ?id rdfs:label ?idLabel }
            OPTIONAL { ?module ramp:name ?nameLabel }
            OPTIONAL { ?module rdfs:label ?label }
            OPTIONAL {
                ?module ramp:isModuleOf ?studyArea .
                ?studyArea rdf:type ramp:StudyArea .
                ?studyArea rdfs:label ?studyAreaLabel
            }
            OPTIONAL { ?module ramp:hasMandatoryPrerequisite ?prereq . ?prereq rdfs:label ?prereqLabel }
            OPTIONAL { ?module ramp:additionalPrerequisite ?additionalPrereq . ?additionalPrereq rdfs:label ?additionalPrereqLabel }
            OPTIONAL { ?module ramp:ects ?ects }
            OPTIONAL { ?module ramp:examinationDuration ?examDuration }
            OPTIONAL { ?module ramp:hasAssesment ?assessmentLabel }
            OPTIONAL { ?module ramp:hasLecturer ?lecturer . ?lecturer rdfs:label ?lecturerLabel }
            OPTIONAL { ?module ramp:hasPersonInCharge ?personInCharge . ?personInCharge rdfs:label ?personInChargeLabel }
            OPTIONAL { ?module ramp:offeredIn ?offeredInLabel }
            OPTIONAL { ?module ramp:recommendedLiterature ?recLiterature . ?recLiterature rdfs:label ?recLiteratureLabel }
            OPTIONAL { ?module ramp:recommendedSemester ?recSemester . ?recSemester rdfs:label ?recSemesterLabel }
            OPTIONAL { ?module ramp:workloadInPerson ?workloadInPerson . ?workloadInPerson rdfs:label ?workloadInPersonLabel }
            OPTIONAL { ?module ramp:workloadSelfStudy ?workloadSelfStudy . ?workloadSelfStudy rdfs:label ?workloadSelfStudyLabel }
            OPTIONAL { ?module ramp:hasFurtherModule ?furtherModule . ?furtherModule rdfs:label ?furtherModuleLabel }
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
                examDistLabels: splitValues(binding.examDistLabels),
                assessmentFormLabels: splitValues(binding.assessmentFormLabels),
                lecturerLabels: splitValues(binding.lecturerLabels),
                personInChargeLabels: splitValues(binding.personInChargeLabels),
                offeredInLabels: splitValues(binding.offeredInLabels).map(mapOfferedIn), // Normalize here
                recLiteratureLabels: splitValues(binding.recLiteratureLabels),
                recSemesterLabels: parseNumberList(binding.recSemesterLabels),
                workloadInPersonLabels: parseNumberList(binding.workloadInPersonLabels),
                workloadSelfStudyLabels: parseNumberList(binding.workloadSelfStudyLabels),
                furtherModuleLabels: splitValues(binding.furtherModuleLabels),
                hasPrereqLabels: splitValues(binding.hasPrereqLabels),
                hasModuleLabels: splitValues(binding.hasModuleLabels),
            };
        });

        return bindings;
    } catch (error) {
        console.error('Error fetching all modules:', error);
        throw error;
    }
}

/**
 * Fetches module data for a specific study program and caches the results.
 * @param studyProgramUri - The URI of the study program.
 * @returns Promise resolving to an array of ModuleBinding objects.
 */
export async function getModules(studyProgramUri: string): Promise<ModuleBinding[]> {
    // Adjust the cache key to include the study program URI
    const cacheKey = `modulesData-${studyProgramUri}`;
    const cachedData = cache.get<ModuleBinding[]>(cacheKey);
    if (cachedData) {
        console.log('Returning cached module data for study program:', studyProgramUri);
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
            (GROUP_CONCAT(DISTINCT ?ects; separator="|") as ?ectsLabels)
            (GROUP_CONCAT(DISTINCT ?examDuration; separator="|") as ?examDurationLabels)
            (GROUP_CONCAT(DISTINCT ?examDistLabel; separator="|") as ?examDistLabels)
            (GROUP_CONCAT(DISTINCT ?assessmentFormLabel; separator="|") as ?assessmentFormLabels)
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
        WHERE {
            ?module rdf:type ramp:Module .
            ?module ramp:isModuleOf <${studyProgramUri}> .
            FILTER (STRSTARTS(STR(?module), "http://ramp.uni-mannheim.de/module/"))
            OPTIONAL { ?module ramp:id ?id . ?id rdfs:label ?idLabel }
            OPTIONAL { ?module ramp:name ?nameLabel }
            OPTIONAL { ?module rdfs:label ?label }
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
            OPTIONAL { ?module ramp:hasMandatoryPrerequisite ?prereq . ?prereq rdfs:label ?prereqLabel }
            OPTIONAL { ?module ramp:additionalPrerequisite ?additionalPrereq . ?additionalPrereq rdfs:label ?additionalPrereqLabel }
            OPTIONAL { ?module ramp:ects ?ects }    
            OPTIONAL { ?module ramp:examinationDuration ?examDuration }
            OPTIONAL { ?module ramp:examinationDistribution ?examDist . ?examDist rdfs:label ?examDistLabel }
            OPTIONAL { ?module ramp:hasAssessmentForm ?assessmentForm . ?assessmentForm rdfs:label ?assessmentFormLabel }
            OPTIONAL { ?module ramp:hasLecturer ?lecturer . ?lecturer rdfs:label ?lecturerLabel }
            OPTIONAL { ?module ramp:hasPersonInCharge ?personInCharge . ?personInCharge rdfs:label ?personInChargeLabel }
            OPTIONAL { ?module ramp:offeredIn ?offeredInLabel }
            OPTIONAL { ?module ramp:recommendedLiterature ?recLiterature . ?recLiterature rdfs:label ?recLiteratureLabel }
            OPTIONAL { ?module ramp:recommendedSemester ?recSemester . ?recSemester rdfs:label ?recSemesterLabel }
            OPTIONAL { ?module ramp:workloadInPerson ?workloadInPerson . ?workloadInPerson rdfs:label ?workloadInPersonLabel }
            OPTIONAL { ?module ramp:workloadSelfStudy ?workloadSelfStudy . ?workloadSelfStudy rdfs:label ?workloadSelfStudyLabel }
            OPTIONAL { ?module ramp:hasFurtherModule ?furtherModule . ?furtherModule rdfs:label ?furtherModuleLabel }
            OPTIONAL { ?module ramp:hasPrerequisite ?hasPrereq . ?hasPrereq rdfs:label ?hasPrereqLabel }
            OPTIONAL { ?module ramp:hasModule ?hasModule . ?hasModule rdfs:label ?hasModuleLabel }
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
                examDistLabels: splitValues(binding.examDistLabels),
                assessmentFormLabels: splitValues(binding.assessmentFormLabels),
                lecturerLabels: splitValues(binding.lecturerLabels),
                personInChargeLabels: splitValues(binding.personInChargeLabels),
                offeredInLabels: splitValues(binding.offeredInLabels).map(mapOfferedIn), // Normalize here
                recLiteratureLabels: splitValues(binding.recLiteratureLabels),
                recSemesterLabels: parseNumberList(binding.recSemesterLabels),
                workloadInPersonLabels: parseNumberList(binding.workloadInPersonLabels),
                workloadSelfStudyLabels: parseNumberList(binding.workloadSelfStudyLabels),
                furtherModuleLabels: splitValues(binding.furtherModuleLabels),
                hasPrereqLabels: splitValues(binding.hasPrereqLabels),
                hasModuleLabels: splitValues(binding.hasModuleLabels),
            };
        });

        cache.set(cacheKey, bindings);
        return bindings;
    } catch (error) {
        console.error('SPARQL query error:', error);
        throw error; // Ensure this is handled in your React components
    }
}

/**
 * Fetches study programs from the SPARQL endpoint.
 * @returns Promise resolving to an array of StudyProgram objects.
 */
export async function getStudyPrograms(): Promise<StudyProgram[]> {
    const query = `
    PREFIX ramp: <http://ramp.uni-mannheim.de/>
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

    SELECT DISTINCT ?studyProgram ?label 
    WHERE {
        ?studyProgram rdf:type ramp:StudyProgram .
        OPTIONAL { ?studyProgram rdfs:label ?label }
    }
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

        const programs: StudyProgram[] = data.results.bindings.map((binding: any) => ({
            uri: binding.studyProgram.value,
            label: binding.label ? binding.label.value : 'Unnamed Study Program',
        }));

        return programs;
    } catch (error) {
        console.error('Error fetching study programs:', error);
        throw error;
    }
}

/**
 * Fetches study requirements based on the selected study program.
 * @param studyProgramUri - The URI of the study program.
 * @returns Promise resolving to an array of StudyRequirement objects.
 */
export async function getStudyRequirements(studyProgramUri: string): Promise<StudyRequirement[]> {
    const cacheKey = `studyRequirements-${studyProgramUri}`;
    const cachedData = cache.get<StudyRequirement[]>(cacheKey);
    if (cachedData) {
        console.log('Returning cached study requirements for study program:', studyProgramUri);
        return cachedData;
    }

    const query = `
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    PREFIX ramp: <http://ramp.uni-mannheim.de/>
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    
    SELECT ?s ?label 
    (MIN(?ects) as ?minEcts)
    (MAX(?ects) as ?maxEcts)
    WHERE { 
        <${studyProgramUri}> ramp:hasStudyArea ?s .
        ?s rdf:type ramp:StudyArea . 
        OPTIONAL { ?s ramp:ects ?ects . }
        OPTIONAL { ?s rdfs:label ?label }
    }
    GROUP BY ?s ?label
    ORDER BY ?s
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

        console.log('SPARQL response data:', data); // Add this line

        const requirements: StudyRequirement[] = data.results.bindings.map((binding: any) => ({
            uri: binding.s.value,
            label: binding.label ? binding.label.value : 'Unnamed Study Area',
            minEcts: binding.minEcts ? parseFloat(binding.minEcts.value) : 0,
            maxEcts: binding.maxEcts ? parseFloat(binding.maxEcts.value) : 0,
        }));

        cache.set(cacheKey, requirements);
        return requirements;
    } catch (error) {
        console.error('Error fetching study requirements:', error);
        throw error;
    }
}
