const axios = require("axios");
const cheerio = require("cheerio");
const queryString = require("querystring");
const flatten = require("lodash.flatten");

const baseURL = "http://images.google.com/search?";

const imageFileExtensions = [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".svg"];

function gis(opts, done) {
    let searchTerm;
    let queryStringAddition;
    let filterOutDomains = ["gstatic.com"];
    let userAgent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/117.0";

    if (typeof opts === "string") {
        searchTerm = opts;
    } else {
        searchTerm = opts.searchTerm;
        queryStringAddition = opts.queryStringAddition;
        if (opts.filterOutDomains) {
            filterOutDomains = filterOutDomains.concat(opts.filterOutDomains);
        }
        if (opts.userAgent) {
            userAgent = opts.userAgent;
        }
    }

    let url =
        baseURL +
        queryString.stringify({
            tbm: "isch",
            q: searchTerm
        });

    if (filterOutDomains) {
        url += encodeURIComponent(
            " " + filterOutDomains.map(addSiteExcludePrefix).join(" ")
        );
    }

    if (queryStringAddition) {
        url += queryStringAddition;
    }

    // console.log(reqOpts.url);
    axios.get(url, {
        headers: {
            "User-Agent": userAgent
        }
    }).then(response => {
        const body = response.data;

        const $ = cheerio.load(body);
        const scripts = $("script");
        const scriptContents = [];
        for (let i = 0; i < scripts.length; ++i) {
            if (scripts[i].children.length > 0) {
                const content = scripts[i].children[0].data;
                if (containsAnyImageFileExtension(content)) {
                    scriptContents.push(content);
                }
            }
        }

        done(error, flatten(scriptContents.map(collectImageRefs)));

        function collectImageRefs(content) {
            const refs = [];
            const re = /\["(http.+?)",(\d+),(\d+)\]/g;
            let result;
            while ((result = re.exec(content)) !== null) {
                if (result.length > 3) {
                    const ref = {
                        url: result[1],
                        width: +result[3],
                        height: +result[2]
                    };
                    if (domainIsOK(ref.url))
                        refs.push(ref);
                }
            }
            return refs;
        }

        function domainIsOK(url) {
            if (!filterOutDomains)
                return true;
            else
                return filterOutDomains.every(skipDomainIsNotInURL);

            function skipDomainIsNotInURL(skipDomain) {
                return url.indexOf(skipDomain) === -1;
            }
        }
    }).catch(error => done(error));
}

function addSiteExcludePrefix(s) {
    return "-site:" + s;
}

function containsAnyImageFileExtension(s) {
    const lowercase = s.toLowerCase();
    return imageFileExtensions.some(containsImageFileExtension);

    function containsImageFileExtension(ext) {
        return lowercase.includes(ext);
    }
}

module.exports = gis;
