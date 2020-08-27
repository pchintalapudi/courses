# Courses

---

## About

This project was inspired by [CourseRoad](https://courseroad.mit.edu), a course planner for MIT students.

I made this project because I had some issues with CourseRoad at the time, specifically that on my schedule it took a long period of time to load class information, and during that time the application was unresponsive to user input. Also, CourseRoad was recently updated and modernized, but as part of the update it lost the ability to draw links between classes and their prerequisites. I aimed to solve all of these issues with my personal version of CourseRoad.

The application itself has a very similar interface to modern CourseRoad, with the class cards and descriptor obtained by clicking on a card. The data is provided by the [FireRoad API](https://fireroad-dev.mit.edu/reference/), which is also used by CourseRoad. The search interface has minor differences, with class filters spread out over the entire top of the application rather than embedded within the searchbar dropdown. Much of the actual differences lie in the network connections, where I put heavy effort into making the calls fully asynchronous and allowing user interaction even while many network requests were going out.

The only other significant difference, the prerequisite links, was achieved by breaking the abstraction of Vue.js and directly manipulating the DOM on window resizes and course plan changes. To improve performance lost because Vue no longer batched DOM updates, I had to manually batch my updates to the backing curves and only invalidate curves with dependencies in semesters that were unaffected by class updates.

## Project setup

```
npm install
```

### Compiles and hot-reloads for development

```
npm run dev
```

### Compiles and minifies for production

```
npm run build
```

### Lints and fixes files

```
npm run lint
```
