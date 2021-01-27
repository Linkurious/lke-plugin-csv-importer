import { CategoriesMapping, EntitiesTypes } from './models';

class CSVUploader {

  private container!: HTMLElement;
  private fileInput!: HTMLInputElement;
  private fileName!: HTMLElement;
  private fileError!: HTMLElement;

  private util: CSVUtils = new CSVUtils();

  init() {
    this.container = document.getElementsByClassName('homeContainer')[0] as HTMLElement;
    this.fileInput = document.getElementById('importFile') as HTMLInputElement;
    this.fileName = document.getElementById('fileName') as HTMLElement;
    this.fileError = document.getElementById('fileError') as HTMLElement;
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
    sessionStorage.removeItem('entityName');
  }

  /**
   * Show file name when user added a file
   */
  showFile() {
    const files = this.fileInput?.files;
    this.hideError();
    if (files && files.length) {
      this.fileName.innerText = files[0].name;
      sessionStorage.setItem('entityName', files[0].name.replace('.csv', ''));
    }
  }

  /**
   * Read and save to session storage the file data
   */
  readFile() {
    const params = new URLSearchParams(window.location.search);
    const sourceKey = params.get('sourceKey');
    if (!sourceKey) {
      this.fileError.innerHTML = 'No source key defined in URL';
      this.showError()
      throw Error('No source key defined in URL');
    }
    sessionStorage.setItem('sourceKey', sourceKey);

    const files = this.fileInput?.files;
    if (!files || !files.length || !files[0].name.endsWith('.csv')) {
        this.fileError.innerHTML = 'Select a valid file';
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
          sessionStorage.setItem('rows', rowsStringify);
          sessionStorage.setItem('headers', headers || '');
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
    this.options = document.getElementsByName('entities') as NodeListOf<HTMLInputElement>;
    this.options[EntitiesTypes.nodes].addEventListener('change', () => this.updateRadioButton(EntitiesTypes.nodes));
    this.options[EntitiesTypes.edges].addEventListener('change', () =>  this.updateRadioButton(EntitiesTypes.edges));
    this.nextButton = document.getElementById('nextButtonEntity') as HTMLButtonElement;
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
    this.titleHolder.innerText = `Is this the ${this.titleCompleter[entityType]}?`;
  }

  /**
   * Using data in session storage, show node category name to user
   */
  setNameCategory() {
    const categoryName = sessionStorage.getItem('entityName'); 
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

class CSVEntityProperties {
  private container!: HTMLElement;
  private entityProperties!: HTMLElement;
  private titleHolder!: HTMLElement;
  private nextButton!: HTMLButtonElement;

  private largestPropertyLength = 0;

  private utilCSV = new CSVUtils();

  private titleCompleter = [
    'node',
    'edge'
  ]

  init() {
    this.container = document.getElementsByClassName('entityPropsContainer')[0] as HTMLElement;
    this.titleHolder = this.container.getElementsByClassName('titleCard')[0] as HTMLElement;
    this.entityProperties = document.getElementById('nameProps') as HTMLElement;
    this.nextButton = document.getElementById('nextButtonProps') as HTMLButtonElement;
    this.hideCard();
  }

  setTitle(entityType: EntitiesTypes) {
    this.titleHolder.innerText = `The following will be mapped to ${this.titleCompleter[entityType]} properties`;
  }

  /**
   * Using data in session storage, show properties name that will be added to each node (headers name)
   */
  setNameProperties(entityType: EntitiesTypes) {
    this.utilCSV.removeChildrenOf(this.entityProperties)
    const headers = sessionStorage.getItem('headers');
    if (headers) {
      const headersParsed = headers.split(',');
      const headersFinal = entityType === EntitiesTypes.nodes ? headersParsed : headersParsed.slice(2);
      this.largestPropertyLength = headersFinal.reduce((maxLength: number, header: string)  => {
        return header.length > maxLength ? header.length : maxLength;
      }, 0);
      headersFinal.forEach((header: string) => {
        this.addProperty(header);
      })
    }
  }

  setButtonName(entityType: EntitiesTypes) {
    this.nextButton.innerText = entityType === EntitiesTypes.nodes ? 'Import' : 'Next';
  }

  /**
   * Add 1 property name to property names container
   */
  addProperty(name: string) {
    const newProperty = document.createElement('div');
    newProperty.innerText = name;
    newProperty.className = 'nodeProperty';
    newProperty.style.width = `${this.largestPropertyLength * 10}px`;
    this.entityProperties.append(newProperty)
  }

  /**
   * Using data in session storage, import it and return message of success
   */
  async importNodes(): Promise<string> {
    this.utilCSV.startWaiting();
    try {
      const rows = sessionStorage.getItem('rows');
      const headers = sessionStorage.getItem('headers');
      const categoryName = sessionStorage.getItem('entityName');
      if (rows && headers && categoryName) {
        const rowsParsed = JSON.parse(rows);
        const headersParsed = headers.split(',');
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

  async nextStep(entityType: EntitiesTypes): Promise<string | undefined> {
    this.hideCard();
    if (entityType === EntitiesTypes.nodes) {
      const feedback = await this.importNodes();
      return feedback;
    }
    return undefined;
  }

  hideCard() {
    this.container.style.display = 'none';
  }

  showCard(entityType?: EntitiesTypes) {
    if (entityType !== undefined) {
      this.setTitle(entityType);
      this.setNameProperties(entityType);
      this.setButtonName(entityType)
    }
    this.container.style.display = 'block';
  }
}

class CSVEdgeMapping {
  private container!: HTMLElement;
  private inputs!: HTMLCollectionOf<HTMLInputElement>;
  private importButton!: HTMLButtonElement;

  private utilCSV = new CSVUtils();

  init() {
    this.container = document.getElementsByClassName('edgeMappingContainer')[0] as HTMLElement;
    this.inputs = this.container.getElementsByClassName('mapInput') as HTMLCollectionOf<HTMLInputElement>;
    this.importButton = this.container.getElementsByClassName('primaryButton')[0] as HTMLButtonElement;
    this.importButton.disabled = true;
    this.hideCard();

    this.inputs[0].value = '';
    this.inputs[1].value = '';
    this.inputs[0].addEventListener('input', this.onChangeInput.bind(this))
    this.inputs[1].addEventListener('input', this.onChangeInput.bind(this))
  }

  onChangeInput() {
    this.importButton.disabled = !(this.inputs[0].value && this.inputs[1].value)
  }

  /**
   * Using data in session storage, import it and return message of success
   */
  async importEdges(categoriesMapping: CategoriesMapping): Promise<string> {
    this.utilCSV.startWaiting();
    try {
      const rows = sessionStorage.getItem('rows');
      const headers = sessionStorage.getItem('headers');
      const edgeType = sessionStorage.getItem('entityName');
      if (rows && headers && edgeType) {
        const rowsParsed = JSON.parse(rows);
        const headersParsed = headers.split(',');
        const queryTemplate = this.createEdgeTemplate(categoriesMapping, edgeType, headersParsed);
        const edges = this.createQueries(queryTemplate, rowsParsed);
        const resNodes = await this.utilCSV.makeRequest(
          'POST',
          `api/addEdges?sourceKey=${sessionStorage.getItem('sourceKey')}`,
          {
              edges: edges
          }
        );
        const data = JSON.parse(resNodes.response);
        return `${data.success}/${data.total} edges have been added to the database`;
      }
      return '';
    } catch (error) {
      throw new Error('Import has failed');
    } finally {
      this.utilCSV.stopWaiting();
    }
  }

  /**
   * From the edge config create query templates
   */
  private createEdgeTemplate(categories: CategoriesMapping, edgeType: string, edgeProperties: string[]) {
    const fromNode = `uid = ~0~ `;
    let fromQuery = `MATCH (f:${categories.source}) WHERE f.${fromNode}`;

    const toNode = `uid = ~1~ `;
    let toQuery = `MATCH (t:${categories.destination}) WHERE t.${toNode}`;

    const edgePropertiesQuery = edgeProperties.slice(2)
      .map((property, index) => {
        return `SET e.${property} = ~${index + 2}~`;
      })
      .join(' ');
    let edgeQuery = `MERGE (f)-[e:${edgeType}]->(t) ${edgePropertiesQuery} RETURN 1`;

    return fromQuery + toQuery + edgeQuery;
  }

  /**
   * Using query templates and data from the csv file, return a list of queries to be ran
   */
  private createQueries(queryTemplate: string, csv: string[]) {
    let res = [];
    
    for (let l = 0; l < csv.length; l++) {
      let qt = queryTemplate;
      let line = csv[l].split(',');
      for (let p = 0; p < line.length; p++) {
        let par = line[p];
        if (par != '') {
          if (
            (par.startsWith('"') && par.endsWith('"')) ||
            (par.startsWith("'") && par.endsWith("'"))
          ) {
            par = par.slice(1, -1);
          }
          par = par.replace('"', '\\"');
          qt = qt.replace(new RegExp('~' + p + '~', 'g'), '"' + par + '"');
        } else {
          qt = qt.replace(new RegExp('~' + p + '~', 'g'), 'null');
        }
      }
      res.push(qt);
    }
    return res;
  }

  async importAndFeedback() {
    const feedback = await this.importEdges({
      source: this.inputs[0].value,
      destination: this.inputs[1].value
    });
    this.hideCard()
    return feedback;
  }

  hideCard() {
    this.container.style.display = 'none';
  }

  showCard() {
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
    let overlay = document.createElement('div')
    overlay.className = 'overlay';
    overlay.innerHTML = '<div class=\"opacity\"></div><div class=\"highlight\"></div>';
    document.body.appendChild(overlay);
    this.spinner.spin(document.getElementsByClassName('highlight')[0]);
  }

  /**
   * Hide spinner
   */
  stopWaiting() {
    let overlay = document.getElementsByClassName('overlay')[0];
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
  let entityType: EntitiesTypes;

  /************** Initialize plugin  ************/
  const csvUtils = new CSVUtils();

  const uploader = new CSVUploader();
  uploader.init();

  const entityPicker = new CSVEntityPicker();
  entityPicker.init();

  const entityName = new CSVEntityName();
  entityName.init();

  const entityProperties = new CSVEntityProperties();
  entityProperties.init();

  const edgeMapping = new CSVEdgeMapping();
  edgeMapping.init();

  const importFeedback = new CSVImportFeedback();
  importFeedback.init();


  /************** Set event handlers ************/

  // cancel button (go to first page and reset state)
  const cancelButtons = document.getElementsByClassName('cancelButton') as HTMLCollectionOf<HTMLElement>;
  for (let i = 0; i < cancelButtons.length; i++) {
    cancelButtons[i].addEventListener('click', () => {
      resetPlugin();
    });
  }

  // first screen event handler
  const fileInput = document.getElementById('importFile') as HTMLInputElement;
  const readButton = document.getElementById('readButton') as HTMLElement;
  fileInput.addEventListener('change', uploader.showFile.bind(uploader));
  readButton.addEventListener('click', () => {
    uploader.readFile();
    entityPicker.showCard();
  });

  // entity picker event handler
  const previousButtonEntities = document.getElementById('previousButtonEntity') as HTMLInputElement;
  const nextButton = document.getElementById('nextButtonEntity') as HTMLButtonElement;
  previousButtonEntities.addEventListener('click', () => {
    entityPicker.hideCard();
    uploader.showCard();
  });
  nextButton.addEventListener('click', () => {
      entityType = entityPicker.hideCard()!;
      entityName.showCard(entityType);
  });

  // node category event handler
  const previousButtonCat = document.getElementById('previousButtonCat') as HTMLInputElement;
  const nextButtonCat = document.getElementById('nextButtonCat') as HTMLElement;
  previousButtonCat.addEventListener('click', () => {
    entityName.hideCard();
    entityPicker.showCard();
  });
  nextButtonCat.addEventListener('click', () => {
    entityName.hideCard();
    entityProperties.showCard(entityType);
  });

   // node properties event handler
   const previousButtonProps = document.getElementById('previousButtonProps') as HTMLInputElement;
   const nextButtonProps = document.getElementById('nextButtonProps') as HTMLElement;
   previousButtonProps.addEventListener('click', () => {
     entityProperties.hideCard();
     entityName.showCard();
   });
   nextButtonProps.addEventListener('click', async () => {
     const feedback = await entityProperties.nextStep(entityType)
     entityType === EntitiesTypes.nodes ?
      importFeedback.showCard(feedback as string) :
      edgeMapping.showCard()
   });

   // node properties event handler
   const previousButtonEdge = document.getElementById('previousButtonEdge') as HTMLInputElement;
   const importButtonEdge = document.getElementById('importButtonEdge') as HTMLElement;
   previousButtonEdge.addEventListener('click', () => {
     edgeMapping.hideCard();
     entityProperties.showCard();
   });
   importButtonEdge.addEventListener('click', async () => {
      importFeedback.showCard(await edgeMapping.importAndFeedback())
   });

   // import feedback event handler
   const goBackLinkurious = document.getElementById('goBackLinkurious') as HTMLElement;
   const newFileButton = document.getElementById('newFileButton') as HTMLElement;
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
    entityProperties.init();
    edgeMapping.init();
    importFeedback.init();
  }
}

main();
