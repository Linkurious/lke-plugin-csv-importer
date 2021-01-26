import { EntitiesTypes } from "./models";

class CSVUploader {

  private container!: HTMLElement;
  private fileInput!: HTMLInputElement;
  private fileName!: HTMLElement;
  private fileError!: HTMLElement;

  private util: CSVUtils = new CSVUtils();

  init() {
    this.container = document.getElementsByClassName('homeContainer')[0] as HTMLElement;
    this.fileInput = document.getElementById("importFile") as HTMLInputElement;
    this.fileName = document.getElementById("fileName") as HTMLElement;
    this.fileError = document.getElementById("fileError") as HTMLElement;
    this.hideError();
    this.cleanState();
    this.showCard();
  }

  /**
   * Delete session storage and file uploaded to begin to upload
   */
  private cleanState() {
    if (this.fileInput && this.fileInput.files) {
      this.fileInput.value = '';
    }
    this.fileName.innerText = ' ';
    sessionStorage.removeItem('sourceKey');
    sessionStorage.removeItem('rows');
    sessionStorage.removeItem('headers');
    sessionStorage.removeItem('catName');
  }

  /**
   * Show file name when user added a file
   */
  showFile() {
    const files = this.fileInput?.files;
    this.hideError();
    if (files && files.length) {
      this.fileName.innerText = files[0].name;
      sessionStorage.setItem("catName", files[0].name.replace('.csv', ''));
    }
  }

  /**
   * Read and save to session storage the file data
   */
  readFile() {
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

  /**
   * Hide eror message
   */
  hideError() {
    this.fileName.style.display = 'block';
    this.fileError.style.display = 'none';
  }

  /**
   * Show error message
   */
  showError() {
    this.fileName.style.display = 'none';
    this.fileError.style.display = 'block'
  }

  hideCard() {
    this.container.style.display = 'none';
  }

  showCard() {
    this.container.style.display = 'block';
  }
}

class CSVEntityPicker {
  private container!: HTMLElement;
  private options!: NodeListOf<HTMLInputElement>;
  private nextButton!: HTMLButtonElement;

  private checkedOptions: EntitiesTypes | null = null;

  init() {
    this.container = document.getElementsByClassName('pickEntityContainer')[0] as HTMLElement;
    this.options = document.getElementsByName("entities") as NodeListOf<HTMLInputElement>;
    this.options[EntitiesTypes.nodes].addEventListener('change', () => this.updateRadioButton(EntitiesTypes.nodes));
    this.options[EntitiesTypes.edges].addEventListener('change', () =>  this.updateRadioButton(EntitiesTypes.edges));
    this.nextButton = document.getElementById("nextButtonEntity") as HTMLButtonElement;
    this.cleanState();
    this.hideCard();
  }

  cleanState() {
    this.checkedOptions = null;
    this.options[0].checked = false;
    this.options[1].checked = false;
    this.nextButton.disabled = true;
  }

  updateRadioButton(value: EntitiesTypes) {
    if (value === EntitiesTypes.nodes) {
      this.options[0].checked = true;
      this.options[1].checked = false;
    } else {
      this.options[0].checked = false;
      this.options[1].checked = true;
    }
    this.checkedOptions = value;
    this.nextButton.disabled = false;
  }

  hideCard() {
    this.container.style.display = 'none';
    return this.checkedOptions;
  }

  showCard() {
    this.container.style.display = 'block';
  }
}

class CSVEntityName {
  private container!: HTMLElement;
  private entityName!: HTMLElement;
  private titleHolder!: HTMLElement;

  private titleCompleter = [
    'node category',
    'edge type'
  ]

  init() {
    this.container = document.getElementsByClassName('entityNameContainer')[0] as HTMLElement;
    this.titleHolder = this.container.getElementsByClassName('titleCard')[0] as HTMLElement;
    this.entityName = document.getElementById('nameCat') as HTMLElement;
    this.hideCard();
  }

  setTitle(entityType: EntitiesTypes) {
    console.log(this.titleHolder)
    this.titleHolder.innerText = `Is this the ${this.titleCompleter[entityType]}?`;
  }

  /**
   * Using data in session storage, show node category name to user
   */
  setNameCategory() {
    const categoryName = sessionStorage.getItem('catName'); 
    if (categoryName) {
      this.entityName.innerText = categoryName;
    }
  }

  hideCard() {
    this.container.style.display = 'none';
  }

  showCard(entityType?: EntitiesTypes) {
    if (entityType !== undefined) {
      this.setTitle(entityType);
    }
    this.setNameCategory()
    this.container.style.display = 'block';
  }
}

class CSVNodeProperties {
  private container!: HTMLElement;
  private nodeProperties!: HTMLElement;

  private largestPropertyLength = 0;

  private utilCSV = new CSVUtils();

  init() {
    this.container = document.getElementsByClassName('nodePropsContainer')[0] as HTMLElement;
    this.nodeProperties = document.getElementById('nameProps') as HTMLElement;
    this.hideCard();
  }

  /**
   * Using data in session storage, show properties name that will be added to each node (headers name)
   */
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

  /**
   * Add 1 property name to property names container
   */
  addProperty(name: string) {
    const newProperty = document.createElement('div');
    newProperty.innerText = name;
    newProperty.className = 'nodeProperty';
    newProperty.style.width = `${this.largestPropertyLength * 10}px`;
    this.nodeProperties.append(newProperty)
  }

  /**
   * Using data in session storage, import it and return message of success
   */
  async importNodes(): Promise<string> {
    this.utilCSV.startWaiting();
    try {
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
    } catch (error) {
      throw new Error('Import has failed');
    } finally {
      this.utilCSV.stopWaiting();
    }
  }

  async importAndShowFeedback() {
    const feedback = await this.importNodes();
    this.hideCard();
    return feedback;
  }

  hideCard() {
    this.container.style.display = 'none';
  }

  showCard() {
    this.setNameProperties();
    this.container.style.display = 'block';
  }
}

class CSVImportFeedback {
  private container!: HTMLElement;
  private importFeedback!: HTMLElement;

  init() {
    this.container = document.getElementsByClassName('nextstep')[0] as HTMLElement;
    this.importFeedback = document.getElementsByClassName('importFeedback')[0] as HTMLElement;
    this.hideCard();
  }

  setFeedback(feedback: string) {
    this.importFeedback.innerText = feedback;
  }

  hideCard() {
    this.container.style.display = 'none';
  }

  showCard(feedback: string) {
    this.setFeedback(feedback);
    this.container.style.display = 'block';
  }
}

class CSVUtils {

  // @ts-ignore
  private spinner = new Spinner();

  /**
   * Show spinner on top of page
   */
  startWaiting() {
    let overlay = document.createElement("div")
    overlay.className = "overlay";
    overlay.innerHTML = "<div class=\"opacity\"></div><div class=\"highlight\"></div>"
    document.body.appendChild(overlay);
    this.spinner.spin(document.getElementsByClassName("highlight")[0]);
  }

  /**
   * Hide spinner
   */
  stopWaiting() {
    let overlay = document.getElementsByClassName("overlay")[0];
    if (overlay && overlay.parentElement) {
      this.spinner.stop();
      overlay.parentElement.removeChild(overlay);
    }
  }

  /**
   * Go back to linkurious home page
   */
  goToLinkurious() {
    window.location = window.location.origin as unknown as Location;
  }

  /**
   * Javascript utility
   * Remove all children of a given node
   */
  removeChildrenOf(node: HTMLElement) {
    while (node.firstChild) {
      node.removeChild(node.lastChild as ChildNode);
    }
  }

  /**
  * make XMLHttpRequest
  */
  makeRequest(verb = 'GET', url: string, body: any): Promise<XMLHttpRequest> {
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
  /************** Initialize plugin  ************/
  const csvUtils = new CSVUtils();

  const uploader = new CSVUploader();
  uploader.init();

  const entityPicker = new CSVEntityPicker();
  entityPicker.init();

  const entityName = new CSVEntityName();
  entityName.init();

  const nodeProperties = new CSVNodeProperties();
  nodeProperties.init();

  const importFeedback = new CSVImportFeedback();
  importFeedback.init();

  /************** Set event handlers ************/

  // cancel button (go to first page and reset state)
  const cancelButtons = document.getElementsByClassName("cancelButton") as HTMLCollectionOf<HTMLElement>;
  for (let i = 0; i < cancelButtons.length; i++) {
    cancelButtons[i].addEventListener('click', () => {
      resetPlugin();
    });
  }

  // first screen event handler
  const fileInput = document.getElementById("importFile") as HTMLInputElement;
  const readButton = document.getElementById("readButton") as HTMLElement;
  fileInput.addEventListener('change', uploader.showFile.bind(uploader));
  readButton.addEventListener('click', () => {
    uploader.readFile();
    entityPicker.showCard();
  });

  const previousButtonEntities = document.getElementById("previousButtonEntity") as HTMLInputElement;
  const nextButton = document.getElementById("nextButtonEntity") as HTMLButtonElement;
  previousButtonEntities.addEventListener('click', () => {
    entityPicker.hideCard();
    uploader.showCard();
  });
  nextButton.addEventListener('click', () => {
      entityName.showCard(entityPicker.hideCard()!);
  });

  // node category event handler
  const previousButtonCat = document.getElementById("previousButtonCat") as HTMLInputElement;
  const nextButtonCat = document.getElementById("nextButtonCat") as HTMLElement;
  previousButtonCat.addEventListener('click', () => {
    entityName.hideCard();
    entityPicker.showCard();
  });
  nextButtonCat.addEventListener('click', () => {
    entityName.hideCard();
    nodeProperties.showCard();
  });

   // node properties event handler
   const previousButtonProps = document.getElementById("previousButtonProps") as HTMLInputElement;
   const nextButtonProps = document.getElementById("nextButtonProps") as HTMLElement;
   previousButtonProps.addEventListener('click', () => {
     nodeProperties.hideCard();
     entityName.showCard();
   });
   nextButtonProps.addEventListener('click', async () => {
     importFeedback.showCard(await nodeProperties.importAndShowFeedback());
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
    entityPicker.init();
    entityName.init();
    nodeProperties.init();
    importFeedback.init();
  }
}

main();
