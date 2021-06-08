import {startWaiting, stopWaiting} from "../utils";

const FILE_SIZE_LIMIT = 5 * Math.pow(10, 6);

/**
 * All logic related to the first card (uploading .csv file)
 */
export class CSVUploader {
  private container!: HTMLElement;
  private fileInput!: HTMLInputElement;
  private fileName!: HTMLElement;
  private fileError!: HTMLElement;
  private _sourceKey!: string | null;
  private _propertiesValue!: Array<string> | null;
  private _propertiesName!: string | null;
  private _entityName!: string;

  get propertiesValue(): Array<string> | null {
    return this._propertiesValue
  }

  get propertiesName(): string | null {
    return this._propertiesName
  }

  get entityName(): string {
    return this._entityName
  }

  get sourceKey(): string | null {
    return this._sourceKey
  }


  init() {
    this.container = document.getElementById(
      "homeContainer"
    ) as HTMLElement;
    this.fileInput = document.getElementById("importFile") as HTMLInputElement;
    this.fileName = document.getElementById("fileName") as HTMLElement;
    this.fileError = document.getElementById("fileError") as HTMLElement;
    this.hideError();
    this.cleanState();
    this.showCard();
  }

  /**
   * clean the state
   */
  private cleanState() {
    if (this.fileInput && this.fileInput.files) {
      this.fileInput.value = "";
    }
    this.fileName.innerText = " ";
  }

  /**
   * Show file name when user added a file
   */
  showFile() {
    const files = this.fileInput?.files;
    this.hideError();
    if (files && files.length) {
      this.fileName.innerText = files[0].name;
      this._entityName = files[0].name.replace(".csv", "")
    }
  }

  /**
   * Read and save the csv file
   */
  readFile() {
    return new Promise((resolve) => {
      const params = new URLSearchParams(window.location.search);
      this._sourceKey = params.get("sourceKey");
      if (!this._sourceKey) {
        this.fileError.innerHTML = "No source key defined in URL";
        this.showError();
        throw Error("No source key defined in URL");
      }

      const files = this.fileInput?.files;
      if (!files || !files.length || !files[0].name.endsWith(".csv")) {
        this.fileError.innerHTML = "Select a valid file";
        this.showError();
        throw Error("Select a valid file");
      } else if (files[0].size > FILE_SIZE_LIMIT) {
        this.fileError.innerHTML = 'The size of the file is more than the fixed limit 4mb';
        this.showError();
        throw Error('The size of the file is more than the fixed limit 4mbvalid file');
      }
      startWaiting();
      let fr = new FileReader();
      fr.onload = (event) => {
        stopWaiting();
        if (event && event.target && event.target.result) {
          const result = event.target.result as string;
          // this regex identifies all new line characters (independantly of the OS: windows or unix)
          // then it creates an array of string (each line is an element of the array)
          const rows = result.split(/\r?\n|\r/);
          const headers = rows.shift();
          this._propertiesValue = rows;
          this._propertiesName = headers || "";
          resolve('done');
          this.hideCard();
        }
      };
      fr.readAsText(files[0]);
    })

  }

  /**
   * Hide eror message
   */
  hideError() {
    this.fileName.style.display = "block";
    this.fileError.style.display = "none";
  }

  /**
   * Show error message
   */
  showError() {
    this.fileName.style.display = "none";
    this.fileError.style.display = "block";
  }

  hideCard() {
    this.container.style.display = "none";
  }

  showCard() {
    this.container.style.display = "block";
  }
}
