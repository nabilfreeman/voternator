require('dotenv').load();
module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    copy: {
      main: {
          expand: true,
          cwd: 'site/',
          src: '**',
          dest: 'build/',
      },
    },
    uglify: {
        main: {
            files: {
                'build/js/main.js': ['build/js/main.js']
            }
        }
    },
    s3: {
      options: {
        region: 'us-east-1',
        access: 'public-read',
        debug: false,
        gzip: true
      },
      default: {
        options: {
          key: process.env.key,
          secret: process.env.secret,
          bucket: "the-voternator-resources"
        },

        sync: [
          {
            src: 'build/**/*.*',
            dest: '/',
            rel: 'build',
            options: {
              verify: true
            }
          }
        ]
      }
    },
  });
  grunt.loadNpmTasks('grunt-s3');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-uglify');

  grunt.registerTask('deploy', ['copy', 'uglify', 's3']);
};
