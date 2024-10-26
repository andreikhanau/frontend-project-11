import "../node_modules/bootstrap/dist/css/bootstrap.css";
import * as Yup from "yup";
import view from "./view";
import i18next from "i18next";
import ru from "./locales/ru";
import { getTxt, reverseFeeds } from "./functions";
import onChange from "on-change";
import { Modal } from "bootstrap";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";

const model = {
  state: {
    urlStatus: "not valid",
    statusMessage: "",
    listOfValidURLs: [],
    feeds: [],
    posts: [],
    clickedLinks: [],
    error: "",
  },

  watchedState: null,

  addClickedLink(id) {
    if (!this.watchedState.clickedLinks.includes(id)) {
      this.watchedState.clickedLinks.push(id);
    }
  },

  initWatcher() {
    this.watchedState = onChange(this.state, () => {
      appController.runView();
    });
  },

  updateFeeds(url) {
    appController.processRSSFeed(url).then((data) => {
      if (data){
        reverseFeeds(data.posts).forEach((post) => {
        const isPostExists = this.watchedState.posts.some(
          (existingPost) => existingPost.title === post.title
        );
        if (!isPostExists) {
          this.watchedState.posts.unshift(post);
          this.watchedState.error = "";
        }
      });
    }
    else this.watchedState.urlStatus = getTxt("invalidURLStatus");
    });
  },
  processNewFeeds(url) {
    appController.processRSSFeed(url).then((data) => {
      if (data) {
        if (!this.watchedState.listOfValidURLs.includes(url)) {
          this.watchedState.listOfValidURLs.push(url);
          this.watchedState.statusMessage = getTxt("succesfulRSSLoad");
          this.watchedState.urlStatus = getTxt("validURLStatus");
          this.watchedState.feeds.unshift(data.feed);
          reverseFeeds(data.posts).forEach((post) => {
            this.watchedState.posts.unshift(post);
          });
          this.watchedState.error = "";
        } else {
          this.watchedState.urlStatus = getTxt("invalidURLStatus");
          this.watchedState.error = getTxt("RSSAlreadyExists");
        }
      } else {
        this.watchedState.urlStatus = getTxt("invalidURLStatus");
      }
    });
  },
  startProcessingWithTimeout() {
    this.watchedState.listOfValidURLs.forEach((url) => {
      this.updateFeeds(url);
    });

    setTimeout(() => this.startProcessingWithTimeout(), 5000);
  },
  validationSchema: Yup.object().shape({
    url: Yup.string()
      .url(getTxt("yupInvalidFormat"))
      //.required(getTxt("yupLackOfURL")),
  }),
  errorHandler() {
    this.watchedState.urlStatus = getTxt("invalidURLStatus");
    this.watchedState.statusMessage = this.state.error;
  },
}; //endModel

export const appController = {
  
    fetchRSSFeed(url) {
    const proxyUrl = `https://allorigins.hexlet.app/get?disableCache=true&url=${encodeURIComponent(
      url
    )}`;
    return axios
      .get(proxyUrl)
      .then((response) => response.data.contents)
      .catch((error) => {
        if (error.response) {
            // Server responded with a status other than 2xx
            this.watchedState.error = error.response.status;
            throw new Error(`Server error: ${error.response.status}`);
          } else if (error.request) {
            // Request was made but no response received (network error)
            model.watchedState.error = getTxt("networkError");
            console.log(model.watchedState.error)
            throw new Error(getTxt("networkError"));
          } else {
            // Something happened in setting up the request
            model.watchedState.error = error.message;
            throw new Error("Failed to fetch RSS feed");
          }
        
      });
  },

  parseRSS(xmlString) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlString, "application/xml");

    if (doc.querySelector("parsererror")) {
      model.watchedState.error = "Error parsing XML";
      throw new Error (getTxt("noValidRss"));
    }

    return doc;
  },

  structureFeed(doc) {
    const feedId = uuidv4();
    const feedTitle = doc.querySelector("channel > title").textContent;
    const feedDescription = doc.querySelector(
      "channel > description"
    ).textContent;

    const items = doc.querySelectorAll("item");
    const posts = Array.from(items).map((item) => ({
      id: uuidv4(),
      feedId: feedId,
      title: item.querySelector("title").textContent,
      link: item.querySelector("link").textContent,
      description: item.querySelector("description").textContent,
    }));

    return {
      feed: {
        id: feedId,
        title: feedTitle,
        description: feedDescription,
      },
      posts: posts,
    };
  },

  processRSSFeed(url) {
    return this.fetchRSSFeed(url)
      .then((xmlString) => {
        const doc = this.parseRSS(xmlString);
        return this.structureFeed(doc);
      })
      .catch((error) => {
        model.watchedState.error = error.message;
        return null;
      });
  },
  getForm: document.querySelector(
    "body > main > section.container-fluid.bg-dark.p-5 > div > div > form"
  ),
  runView() {
    view.render(model.watchedState);
  },
  modalHandler() {
    const modalTitle = document.querySelector(".modal-title");
    const modalBody = document.querySelector(".modal-body");
    const modalFooter = document.querySelector(".modal-footer .full-article");
    const modalElement = document.getElementById("modal");
    const getLinks = document.querySelector(
      "body > main > section.container-fluid.container-xxl.p-5 > div > div.col-md-10.col-lg-8.order-1.mx-auto.posts > div > ul"
    ).children;
    const modal = new Modal(modalElement);
    return Array.from(getLinks).forEach((child) => {
      let currentTitle;
      let currentDescription;
      let currentLink;
      const getLink = child.querySelector("a");
      const getSeeModalButton = child.querySelector("button");
      const getID = getLink.getAttribute("data-id");
      model.watchedState.posts.forEach((post) => {
        if (post.id === getID) {
          currentTitle = post.title;
          currentDescription = post.description;
          currentLink = post.link;
          getLink.addEventListener("click", () => model.addClickedLink(getID));
          getSeeModalButton.addEventListener("click", () => {
            model.addClickedLink(getID);
            modalTitle.textContent = currentTitle;
            modalBody.textContent = currentDescription;
            modalFooter.href = currentLink;
            modal.show();
            const getCloseButton = document.querySelector(
              "#modal > div > div > div.modal-footer > button"
            );
            getCloseButton.addEventListener("click", () => {
              modal.hide();
            });
          });
        }
      });
    });
  },
  init() {
    i18next.init(ru);
    const submitHandler = (e) => {
      e.preventDefault();
      const formData = new FormData(this.getForm);
      const getProvidedLink = formData.get("url");
      console.log(getProvidedLink)
      if (getProvidedLink.length === 0){
        model.watchedState.urlStatus = getTxt("invalidURLStatus");
        model.watchedState.statusMessage = getTxt("isEmpty");
      } else 
      {
        model.validationSchema
        .validate({ url: getProvidedLink })
        .then(() => {
          model.processNewFeeds(getProvidedLink);
        })
        .catch((error) => {
          model.watchedState.error = error;
        });
      setTimeout(() => model.startProcessingWithTimeout(), 5000);
      model.initWatcher();}
    }; //submitHandler

    this.getForm.addEventListener("submit", submitHandler);
  }, //endInit
}; //endController
