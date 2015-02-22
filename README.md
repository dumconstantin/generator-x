## Generator X - End to End Web Development Automation system integrated with Photoshop

[![ScreenShot](https://raw.githubusercontent.com/BrandUPInteractive/generator-x/master/screencast.jpg)](http://youtu.be/lksD2a6nSik)

#### NOTE: In development, not suitable for production.

### Setup

1. Clone and setup https://github.com/adobe-photoshop/generator-core (Follow all the setup instructions and don't forget to use Photoshop CC with Generator Enabled).
2. Clone the Generator X repository.
3. Run in terminal (you'll need to have a PSD opened):
node app.js -f ../generator-x
4. Go to *generator-x/projects* and find the generated PSD there.

*Note*: Also set Photoshop Units to PX instead of Points.

### What it is
Generator X is a NodeJS plugin/service for Adobe Generator Core that understands a Photoshop PSD and writes the code necessary to put that design online. 

It automates the slicing of PSDs, it exports text and fonts, it recreates styles and effects in CSS3 and aligns everything to match the PSD file using absolute and relative positioning. Pending integrations with with Wordpress and Symphony. It's really something :) Also, it's just begging for an automated deployment to live system to get from Photoshop to Live visitors in an instant.

### Features
* Full layer HTML structure export
* Fully Automated CSS3 export from PSD with full support for Photoshop layer effects
* Shapes are exported as vectors
* Full font styles export and font library
* Full export of images as background or as img tags
* Absolute positioning export
* Relative positioning export algorithm that intelligently calculates proximity, parent-child nesting, HTML element organisation and optimisation hierarchy
* CMS and Frameworks integration (currently a shy Wordpress integration but expanding to Symphony as well)

*Note*: I didn't have time to finalize bug fixing Relative positioning and this is why you will have to enable it by uncommenting line 367 from Structure.js:
//  this.optimisePositioning();

### Mission
Imagine materializing your intention in a heartbeat. You think of a solution, you describe your solution visually and its done.
The instant manifestation of intent through a system that understands the medium in which you solve problems.

Websites, e-shops, web apps, social networks are the bricks of today's humanity. What if we could reverse engineer everything?

What if developers wouldn't have to rewrite boilerplate code, what if the only thing they did was to create, innovate and focus on the world's toughest problems.

The Generator X's mission, and also my mission, is to free developers time and energy and also that of designers, managers, testers and business owners and make room for a collaboration and interconnectivity that surpasses productivity and defines creativity. 

We need to work less, live more and allow technology to fulfill its mission of easing production. 

### Is it difficult to use?
No, there are no steps to actually use it. Included in the Repository there is a server and listens to Photoshop. Once you enable the Photoshop Generator you are good to go.

### What's the benefit of using it?
Presentation websites and simple applications can be done in a day rather than weeks. 

More complex websites and applications will be developed in quarter of the time and effort otherwise required.

Prototyping, developing and launching websites, campaigns or applications will be more reliable and simpler. Faster too.

### A BIG thank you goes to:
Daniel Teodoriu
Bogdan Matei
Greg Whitfield
Colin Whitfield
@the entire BrandUP Interactive team

for supporting the Generator X project in so many ways.

