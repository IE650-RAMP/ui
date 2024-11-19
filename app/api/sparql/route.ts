// app/api/sparql/route.ts

import { NextRequest, NextResponse } from 'next/server';

// Define the structure of the incoming request
interface SparqlRequestBody {
    query: string;
}

// Define the structure of the SPARQL response
interface SparqlResponse {
    head: { vars: string[] };
    results: {
        bindings: Record<string, { type: string; value: string }>[];
    };
}

const SPARQL_ENDPOINT = process.env.GRAPH_ENDPOINT;
const GRAPH_USERNAME = process.env.GRAPH_USERNAME;
const GRAPH_PASSWORD = process.env.GRAPH_PASSWORD;

// Handle preflight OPTIONS requests
export async function OPTIONS() {
    return NextResponse.json({ message: 'CORS preflight response' }, { status: 200 });
}

// Handle POST requests
export async function POST(request: NextRequest) {
    try {
        // Validate environment variables
        if (!SPARQL_ENDPOINT || !GRAPH_USERNAME || !GRAPH_PASSWORD) {
            return NextResponse.json(
                { error: 'Server configuration error. Please contact the administrator.' },
                { status: 500 }
            );
        }

        // Parse and validate the request body
        const body: SparqlRequestBody = await request.json();

        if (!body.query || typeof body.query !== 'string') {
            console.error('Invalid or missing SPARQL query in request body:', body);
            return NextResponse.json({ error: 'Invalid SPARQL query.' }, { status: 400 });
        }

        // Forward the request to the SPARQL endpoint
        const response = await fetch(SPARQL_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/sparql-query',
                'Authorization': 'Basic ' + Buffer.from(`${GRAPH_USERNAME}:${GRAPH_PASSWORD}`).toString('base64'),
                'Accept': 'application/sparql-results+json', // Ensure the response is in JSON
            },
            body: body.query,
        });

        // Log response status and headers
        console.log('SPARQL Endpoint Response Status:', response.status);
        console.log('SPARQL Endpoint Response Headers:', response.headers);

        // Read the response as text first
        const responseText = await response.text();
        console.log('SPARQL Endpoint Response Body:', responseText);

        // Attempt to parse response as JSON
        let data: SparqlResponse;

        try {
            data = JSON.parse(responseText);
        } catch (parseError: any) {
            console.error('Failed to parse SPARQL response as JSON. Received:', responseText);
            return NextResponse.json(
                { error: 'Failed to parse SPARQL response. Ensure your query is correct.' },
                { status: 500 }
            );
        }

        return NextResponse.json(data, { status: 200 });
    } catch (error: any) {
        console.error('Unexpected error in SPARQL proxy:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
