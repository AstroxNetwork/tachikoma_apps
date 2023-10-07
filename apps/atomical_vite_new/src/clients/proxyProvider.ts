export class ElectrumProxyProvider {
  constructor(public host: string) {}
  public getHost() {
    return this.host;
  }

  public setHost(host: string) {
    this.host = host;
  }

  callGet = async (method: string, params: any[]) => {
    try {
      let url = this.getHost() + '/' + method;
      let req = params && params.length > 0 ? url + '?' + `params=${JSON.stringify(params)}` : url;
      const headers = new Headers();
      headers.append('X-Client', 'Wizz Wallet');
      const res = await (window as any).fetch(new Request(req), { method: 'GET', headers, mode: 'cors', cache: 'default' });
      const data = await res.json();
      if (data.success === true) {
        return data.response;
      } else {
        throw data.error;
      }
    } catch (error) {
      throw `http get error: ${error}`;
    }
  };
  callPost = async (method: string, params: any[]) => {
    try {
      let url = this.getHost() + '/' + method;
      let body = JSON.stringify({ params: JSON.stringify(params) });
      const headers = new Headers();
      headers.append('X-Client', 'Wizz Wallet');
      console.log(body);
      const res = await (window as any).fetch(new Request(url), { method: 'POST', headers, mode: 'cors', cache: 'default', body });
      const data = await res.json();
      console.log(JSON.stringify(data));
      if (data.success === true) {
        return data.response;
      } else {
        throw data.error;
      }
    } catch (error) {
      throw `call post error: ${error}`;
    }
  };
}
