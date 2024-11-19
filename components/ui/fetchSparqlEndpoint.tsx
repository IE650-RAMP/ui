// components/ui/fetchSparqlEndpoint.ts

const SPARQL_ENDPOINT_URL = 'https://your-sparql-endpoint-url'; // Replace with your actual SPARQL endpoint URL

/**
 * Sends a SPARQL query to the specified endpoint and returns the JSON response.
 * @param query - The SPARQL query string.
 * @returns The JSON response from the SPARQL endpoint.
 */
export default async function fetchSparqlEndpoint(query: string): Promise<any> {
    const response = await fetch(SPARQL_ENDPOINT_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/sparql-query',
            'Accept': 'application/sparql-results+json',
        },
        body: query,
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`SPARQL query failed: ${errorText}`);
    }

    const data = await response.json();
    return data;
}
