exports.config = {
    // See http://brunch.io/#documentation for docs.
    files: {
        javascripts: {
            joinTo: "js/app.js"

            // To use a separate vendor.js bundle, specify two files path
            // http://brunch.io/docs/config#-files-
            // joinTo: {
            //   "js/app.js": /^js/,
            //   "js/vendor.js": /^(?!js)/
            // }
            //
            // To change the order of concatenation of files, explicitly mention here
            // order: {
            //   before: [
            //     "vendor/js/jquery-2.1.1.js",
            //     "vendor/js/bootstrap.min.js"
            //   ]
            // }
        },
        stylesheets: {
            joinTo: {
                "css/app.css": ["css/app.scss", "css/phoenix.css"],
                "css/app_night.css": [
                    "css/app.scss",
                    "css/app_night.css",
                    "css/phoenix.css"
                ]
            },
            order: {
                after: ["priv/static/css/app.scss"] // concat app.css last
            }
        },
        templates: {
            joinTo: "js/app.js"
        }
    },

    conventions: {
        // This option sets where we should place non-css and non-js assets in.
        // By default, we set this to "/assets/static". Files in this directory
        // will be copied to `paths.public`, which is "priv/static" by default.
        assets: /^(static)/
    },

    // Phoenix paths configuration
    paths: {
        // Dependencies and current project directories to watch
        watched: ["static", "css", "js", "vendor", "ts"],
        // Where to compile files to
        public: "../priv/static"
    },

    // Configure your plugins
    plugins: {
        babel: {
            // Do not use ES6 compiler in vendor code
            ignore: [/vendor/]
        },
        sass: {
            options: {
                includePaths: [],
                precision: 8 // minimum precision required by bootstrap
            }
        },
        copycat: {
            fonts: ["node_modules/bootstrap-sass/assets/fonts/bootstrap"],
            js: [
                "vendor/js/jquery-3.3.1.min.js",
                // Bootstrap version 3.3 is used as phoenix.css uses
                // bootstrap 3.3.5
                "vendor/js/bootstrap-3.3.7.min.js"
            ]
        }
    },

    modules: {
        autoRequire: {
            "js/app.js": ["js/app"]
        }
    },

    npm: {
        enabled: true
    }
};
