class CSVUploader {

  public container!: HTMLElement;
  public fileInput!: HTMLInputElement;
  public fileName!: HTMLElement;
  public fileError!: HTMLElement;
  public readButton!: HTMLElement;

  public util: CSVUtils = new CSVUtils();

  init() {
    this.container = document.getElementsByClassName('homeContainer')[0] as HTMLElement;
    this.fileInput = document.getElementById("importFile") as HTMLInputElement;
    this.fileName = document.getElementById("fileName") as HTMLElement;
    this.fileError = document.getElementById("fileError") as HTMLElement;
    this.readButton = document.getElementById("readButton") as HTMLElement;
    this.hideError();
    this.cleanState();
    this.showCard();
  }

  cleanState() {
    if (this.fileInput && this.fileInput.files) {
      this.fileInput.value = '';
    }
    this.fileName.innerText = ' ';
    sessionStorage.removeItem('sourceKey');
    sessionStorage.removeItem('rows');
    sessionStorage.removeItem('headers');
    sessionStorage.removeItem('catName');
  }

  public showFile() {
    const files = this.fileInput?.files;
    this.hideError();
    if (files && files.length) {
      this.fileName.innerText = files[0].name;
      sessionStorage.setItem("catName", files[0].name.replace('.csv', ''));
    }
  }

  hideError() {
    this.fileName.style.display = 'block';
    this.fileError.style.display = 'none';
  }

  showError() {
    this.fileName.style.display = 'none';
    this.fileError.style.display = 'block'
  }

  public readFile() {
    const params = new URLSearchParams(window.location.search);
    const sourceKey = params.get("sourceKey");
    if (!sourceKey) {
      this.fileError.innerHTML = "No source key defined in URL";
      this.showError()
      throw Error('No source key defined in URL');
    }
    sessionStorage.setItem("sourceKey", sourceKey);

    const files = this.fileInput?.files;
    if (!files || !files.length || !files[0].name.endsWith(".csv")) {
        this.fileError.innerHTML = "Select a valid file";
        this.showError()
        throw Error('Select a valid file')
    }
    this.util.startWaiting();
    let fr = new FileReader();
    fr.onload = (event) => {
        this.util.stopWaiting();
        if (event && event.target && event.target.result) {
          const result = event.target.result as string;
          const rows = result.split(/\r?\n|\r/);
          const headers = rows.shift();
          const rowsStringify = JSON.stringify(rows);
          sessionStorage.setItem("rows", rowsStringify);
          sessionStorage.setItem("headers", headers || '');
          this.hideCard();
        }
    };
      fr.readAsText(files[0]);
  }

  public hideCard() {
    this.container.style.display = 'none';
  }

  public showCard() {
    this.container.style.display = 'block';
  }
}

class CSVNodeCategory {
  public container!: HTMLElement;
  public nodeCategory!: HTMLElement;
  public nextButton!: HTMLElement;
  public previousButton!: HTMLElement;

  init() {
    this.container = document.getElementsByClassName('nodeCatContainer')[0] as HTMLElement;
    this.nodeCategory = document.getElementById('nameCat') as HTMLElement;
    this.hideCard();
  }

  setNameCategory() {
    const categoryName = sessionStorage.getItem('catName'); 
    if (categoryName) {
      this.nodeCategory.innerText = categoryName;
    }
  }

  hideCard() {
    this.container.style.display = 'none';
  }

  showCard() {
    this.container.style.display = 'block';
  }
}

class CSVNodeProperties {
  public container!: HTMLElement;
  public nodeProperties!: HTMLElement;
  public nextButton!: HTMLElement;
  public previousButton!: HTMLElement;

  public largestPropertyLength = 0;

  public utilCSV = new CSVUtils();

  init() {
    this.container = document.getElementsByClassName('nodePropsContainer')[0] as HTMLElement;
    this.nodeProperties = document.getElementById('nameProps') as HTMLElement;
    this.hideCard();
  }

  setNameProperties() {
    this.utilCSV.removeChildrenOf(this.nodeProperties)
    const headers = sessionStorage.getItem('headers');
    if (headers) {
      const headersParsed = headers.split(",");
      this.largestPropertyLength = headersParsed.reduce((maxLength: number, header: string)  => {
        return header.length > maxLength ? header.length : maxLength;
      }, 0);
      headersParsed.forEach((header: string) => {
        this.addProperty(header);
      })
    }
  }

  addProperty(name: string) {
    const newProperty = document.createElement('div');
    newProperty.innerText = name;
    newProperty.className = 'nodeProperty';
    newProperty.style.width = `${this.largestPropertyLength * 10}px`;
    this.nodeProperties.append(newProperty)
  }

  async importNodes(): Promise<string> {
    const rows = sessionStorage.getItem('rows');
    const headers = sessionStorage.getItem('headers');
    const categoryName = sessionStorage.getItem('catName');
    if (rows && headers && categoryName) {
      const rowsParsed = JSON.parse(rows);
      const headersParsed = headers.split(",");
      const nodes = rowsParsed.map((row: any) => {
        const rowParsed = row.split(',');
        return {
          categories: [categoryName],
          properties: headersParsed.reduce((allProperties, header, index) => {
            return {
              ...allProperties,
              [header]: rowParsed[index]
            }
          }, {})
        }
      });
      const resNodes = await this.utilCSV.makeRequest(
        'POST',
        `api/addNodes?sourceKey=${sessionStorage.getItem('sourceKey')}`,
        {
            nodes: nodes
        }
      );
      const data = JSON.parse(resNodes.response);
      return `${data.success}/${data.total} nodes have been added to the database`;
    }
    return '';
  }

  hideCard() {
    this.container.style.display = 'none';
  }

  showCard() {
    this.container.style.display = 'block';
  }
}

class CSVImportFeedback {
  public container!: HTMLElement;
  public importFeedback!: HTMLElement;
  public newFileButton!: HTMLElement;
  public backToLinkuriousButton!: HTMLElement;

  init() {
    this.container = document.getElementsByClassName('nextstep')[0] as HTMLElement;
    this.importFeedback = document.getElementsByClassName('importFeedback')[0] as HTMLElement;
    this.newFileButton = document.getElementById('newFileButton') as HTMLElement;
    this.hideCard();
  }

  setFeedback(feedback: string) {
    this.importFeedback.innerText = feedback;
  }

  hideCard() {
    this.container.style.display = 'none';
  }

  showCard() {
    this.container.style.display = 'block';
  }
}

class CSVUtils {

  // @ts-ignore
  private spinner = new Spinner();

  public startWaiting() {
    let overlay = document.createElement("div")
    overlay.className = "overlay";
    overlay.innerHTML = "<div class=\"opacity\"></div><div class=\"highlight\"></div>"
    document.body.appendChild(overlay);
    this.spinner.spin(document.getElementsByClassName("highlight")[0]);
  }

  public stopWaiting() {
    let overlay = document.getElementsByClassName("overlay")[0];
    if (overlay && overlay.parentElement) {
      this.spinner.stop();
      overlay.parentElement.removeChild(overlay);
    }
  }

  goToLinkurious() {
    window.location = window.location.origin as unknown as Location;
  }

  public removeChildrenOf(node: HTMLElement) {
    while (node.firstChild) {
      node.removeChild(node.lastChild as ChildNode);
    }
  }

  /**
  * make XMLHttpRequest
  * @param verb : string  default value 'GET'
  * @param url : string   API end point
  * @param body : Object
  * @returns {Promise<any>}
  */
  public makeRequest(verb = 'GET', url: string, body: any): Promise<XMLHttpRequest> {
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
}

function main() {
  let feedbackNodes = '';

  /************** Initialize plugin  ************/
  const csvUtils = new CSVUtils();

  const uploader = new CSVUploader();
  uploader.init();

  const nodeCategory = new CSVNodeCategory();
  nodeCategory.init();

  const nodeProperties = new CSVNodeProperties();
  nodeProperties.init();

  const importFeedback = new CSVImportFeedback();
  importFeedback.init();

  const cancelButtons = document.getElementsByClassName("cancelButton") as HTMLCollectionOf<HTMLElement>;
  for (let i = 0; i < cancelButtons.length; i++) {
    cancelButtons[i].addEventListener('click', () => {
      resetPlugin();
    });
  }

  /************** Set event handlers ************/

  // first screen event handler
  const fileInput = document.getElementById("importFile") as HTMLInputElement;
  const readButton = document.getElementById("readButton") as HTMLElement;
  fileInput.addEventListener('change', uploader.showFile.bind(uploader));
  readButton.addEventListener('click', () => {
    uploader.readFile();
    nodeCategory.setNameCategory();
    nodeCategory.showCard();
  });

  // node category event handler
  const previousButtonCat = document.getElementById("previousButtonCat") as HTMLInputElement;
  const nextButtonCat = document.getElementById("nextButtonCat") as HTMLElement;
  previousButtonCat.addEventListener('click', () => {
    nodeCategory.hideCard();
    uploader.showCard();
  });
  nextButtonCat.addEventListener('click', () => {
    nodeCategory.hideCard();
    nodeProperties.setNameProperties();
    nodeProperties.showCard();
  });

   // node properties event handler
   const previousButtonProps = document.getElementById("previousButtonProps") as HTMLInputElement;
   const nextButtonProps = document.getElementById("nextButtonProps") as HTMLElement;
   previousButtonProps.addEventListener('click', () => {
     nodeProperties.hideCard();
     nodeCategory.showCard();
   });
   nextButtonProps.addEventListener('click', async () => {
     nodeProperties.hideCard();
     feedbackNodes = await nodeProperties.importNodes();
     importFeedback.setFeedback(feedbackNodes);
     importFeedback.showCard();
   });

   // import feedback event handler
   const goBackLinkurious = document.getElementById("goBackLinkurious") as HTMLElement;
   const newFileButton = document.getElementById("newFileButton") as HTMLElement;
   goBackLinkurious.addEventListener('click', async () => {
    csvUtils.goToLinkurious();
  });
   newFileButton.addEventListener('click', async () => {
     importFeedback.hideCard();
     resetPlugin();
   });

   /**
    * Reset all cards to their initial state
    */
  function resetPlugin() {
    uploader.init();
    nodeCategory.init();
    nodeProperties.init();
    importFeedback.init();
  }
}

main();
