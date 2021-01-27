/**
 * All utilities for the CSV project
 */

// @ts-ignore
const spinner = new Spinner();

/**
 * Show spinner on top of page
 */
function startWaiting() {
  let overlay = document.createElement('div')
  overlay.className = 'overlay';
  overlay.innerHTML = '<div class=\"opacity\"></div><div class=\"highlight\"></div>';
  document.body.appendChild(overlay);
  spinner.spin(document.getElementsByClassName('highlight')[0]);
}

/**
 * Hide spinner
 */
function stopWaiting() {
  let overlay = document.getElementsByClassName('overlay')[0];
  if (overlay && overlay.parentElement) {
    spinner.stop();
    overlay.parentElement.removeChild(overlay);
  }
}

/**
 * Go back to linkurious home page
 */
function goToLinkurious() {
  window.location = window.location.origin as unknown as Location;
}

/**
 * Javascript utility
 * Remove all children of a given node
 */
function removeChildrenOf(node: HTMLElement) {
  while (node.firstChild) {
    node.removeChild(node.lastChild as ChildNode);
  }
}

/**
* make XMLHttpRequest
*/
function makeRequest(verb = 'GET', url: string, body: any): Promise<XMLHttpRequest> {
  const xmlHttp = new XMLHttpRequest();
  return new Promise((resolve, reject) => {
      xmlHttp.onreadystatechange = () => {
          // Only run if the request is complete
          if (xmlHttp.readyState !== 4) {
              return;
          }
          // Process the response
          if (xmlHttp.status >= 200 && xmlHttp.status < 300) {
              // If successful
              resolve(xmlHttp);
          } else {
              const message = typeof xmlHttp.response === 'string' ? xmlHttp.response : JSON.parse(xmlHttp.response).body.error;
              // If failed
              reject({
                  status: xmlHttp.status,
                  statusText: xmlHttp.statusText,
                  body: message
              });
          }
      };
      xmlHttp.open(verb, url);
      xmlHttp.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
      xmlHttp.send(JSON.stringify(body));
  });
}

export {
  startWaiting,
  stopWaiting,
  goToLinkurious,
  removeChildrenOf,
  makeRequest
}
