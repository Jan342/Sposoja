export class ServerRequest{
    private request: RequestInit = {};
    private serverAPI: string;

    public constructor(loc: string){
        this.serverAPI = "http://localhost:3001/" + loc;
        this.setCredentials('include');
        this.setHeaders({ 'Content-Type': 'application/json' });
    }

    setMethod(method: string) : ServerRequest{
        this.request.method = method;
        return this;
    }

    setCredentials(credentials: RequestCredentials = 'include') : ServerRequest{
        this.request.credentials = credentials;
        return this;
    }

    setHeaders(headers: HeadersInit) : ServerRequest{
        this.request.headers = headers;
        return this;
    }
    
    setBody(body: any) : ServerRequest{
        this.request.body = JSON.stringify(body);
        return this;
    }

    makeRequest() : Promise<Response>{
        return fetch(this.serverAPI,this.request);
    }

    get(): Promise<Response> {
        this.setMethod('GET');
        return this.makeRequest();
    }

    post(body? : any): Promise<Response> {
        this.setMethod('POST');
        if(body){
            this.setBody(body);
        }
        return this.makeRequest();
    }

    put(): Promise<Response> {
        this.setMethod('PUT');
        return this.makeRequest();
    }

    delete(): Promise<Response> {
        this.setMethod('DELETE');
        return this.makeRequest();
    }
}
