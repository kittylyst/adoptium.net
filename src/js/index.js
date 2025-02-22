const {
  detectOS,
  findPlatform,
  loadLatestAssets,
  makeQueryString,
  setRadioSelectors,
  setTickLink
} = require('./common');
const {
  jvmVariant,
  variant
} = require('./common');
const {
  sampleYoutube,
  newsItems
} = require("../json/config");

// set variables for all index page HTML elements that will be used by the JS
const loading = document.getElementById('loading');
const errorContainer = document.getElementById('error-container');
const dlText = document.getElementById('dl-text');
const dlLatest = document.getElementById('dl-latest');
const dlArchive = document.getElementById('dl-archive');
const dlOther = document.getElementById('dl-other');
const dlIcon = document.getElementById('dl-icon');
const dlIcon2 = document.getElementById('dl-icon-2');
const dlVersionText = document.getElementById('dl-version-text');

// When index page loads, run:
module.exports.load = () => {
  setRadioSelectors();
  removeRadioButtons();

  // Try to match up the detected OS with a platform from 'config.json'
  const OS = detectOS();

  if (OS) {
    dlText.innerHTML = `Download Eclipse Temurin for <var platform-name>${OS.officialName}</var>`;
  }
  dlText.classList.remove('invisible');

  const handleResponse = (releasesJson) => {
    if (!releasesJson) {
      return;
    }
    buildHomepageHTML(releasesJson, {}, OS);
  };

  const throwError = () => {
    errorContainer.innerHTML = `<p>There are no releases available for ${variant} from Temurin yet.`;
    loading.innerHTML = ''; // remove the loading dots
  };

  loadLatestAssets(variant, jvmVariant, 'latest', handleResponse, throwError, () => {
    errorContainer.innerHTML = `<p>There are no releases available for ${variant} from Temurin yet.`;
    loading.innerHTML = ''; // remove the loading dots
  });
};

function removeRadioButtons() {
  const buttons = document.getElementsByClassName('btn-label');
  for (var a = 0; a < buttons.length; a++) {
    if (buttons[a].firstChild.getAttribute('lts') === 'false') {
      buttons[a].style.display = 'none';
    }
  }
}

function buildHomepageHTML(releasesJson, jckJSON, OS) {
  let matchingFile = null;

  // if the OS has been detected...
  if (OS) {
    releasesJson.forEach((eachAsset) => { // iterate through the assets attached to this release
      const uppercaseFilename = eachAsset.binary.package.name.toUpperCase();
      const thisPlatform = findPlatform(eachAsset.binary);

      // firstly, check if a valid searchableName has been returned (i.e. the platform is recognised)...
      if (thisPlatform) {
        // secondly, check if the file has the expected file extension for that platform...
        // (this filters out all non-binary attachments, e.g. SHA checksums - these contain the platform name, but are not binaries)
        if (matchingFile == null) {
          const uppercaseOSname = OS.searchableName.toUpperCase();
          if (Object.keys(jckJSON).length !== 0) {
            if (jckJSON[releasesJson.tag_name] && Object.prototype.hasOwnProperty.call(jckJSON[releasesJson.tag_name], uppercaseOSname)) {
              document.getElementById('jck-approved-tick').classList.remove('hide');
              setTickLink();
            }
          }
          // thirdly check if JDK or JRE (we want to serve JDK by default)
          if (eachAsset.binary.image_type == 'jdk') {
            // fourthly, check if the user's OS searchableName string matches part of this binary's name (e.g. ...X64_LINUX...)
            if (uppercaseFilename.includes(uppercaseOSname)) {
              matchingFile = eachAsset; // set the matchingFile variable to the object containing this binary
            }
          }
        }
      }
    });
  }

  // if there IS a matching binary for the user's OS...
  if (matchingFile) {
    if (matchingFile.binary.installer) {
      dlLatest.href = matchingFile.binary.installer.link; // set the main download button's link to be the installer's download url
    } else {
      dlLatest.href = matchingFile.binary.package.link; // set the main download button's link to be the binary's download url
      dlVersionText.innerHTML += ` - ${Math.floor(matchingFile.binary.package.size / 1000 / 1000)} MB`;
    }
    // set the download button's version number to the latest release
    dlVersionText.innerHTML = matchingFile.release_name;
  } else {
    dlIcon.classList.add('hide'); // hide the download icon on the main button, to make it look less like you're going to get a download immediately
    dlIcon2.classList.remove('hide'); // un-hide an arrow-right icon to show instead
    dlLatest.href = `./releases.html?${makeQueryString({variant, jvmVariant})}`; // set the main download button's link to the latest releases page for all platforms.
  }

  // remove the loading dots, and make all buttons visible, with animated fade-in
  loading.classList.add('hide');
  dlLatest.className = dlLatest.className.replace(/(?:^|\s)invisible(?!\S)/g, ' animated ');
  dlOther.className = dlOther.className.replace(/(?:^|\s)invisible(?!\S)/g, ' animated ');
  dlArchive.className = dlArchive.className.replace(/(?:^|\s)invisible(?!\S)/g, ' animated ');

  dlLatest.onclick = () => {
    document.getElementById('installation-link').className += ' animated pulse infinite transition-bright';
  };

  // animate the main download button shortly after the initial animation has finished.
  setTimeout(() => {
    dlLatest.className = 'dl-button a-button animated pulse';
  }, 1000);

  // set sample youtube section
  const videoTemplate = Handlebars.compile(document.getElementById("template-video").innerHTML);
  document.getElementById("video").innerHTML = videoTemplate({sampleYoutube});

  // setup news section
  const newsTemplate = Handlebars.compile(document.getElementById("newsTemplate").innerHTML);
  document.getElementById("news").innerHTML = newsTemplate({newsItems});
  
}
