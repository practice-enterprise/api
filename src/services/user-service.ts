import { sofa } from "./sofa";
import Axios from 'axios';
import { User } from "../models/users";
import { allCourses } from "../models/canvas";

export class UserService {
  static async getForCourse(courseID: string): Promise<User | undefined> {
    const users = (await sofa.db.users.find({
      selector: {
        courses: {
          $elemMatch: {
            $eq: courseID
          }
        }
      }
    }))

    /*There are no corresponding doc(s) for this courseID */
    if (users.docs.length < 1) {
      return undefined;
    }

    /*Random index for balancing user tokens */
    const index = Math.floor(Math.random() * users.docs.length)
    return users.docs[index];
  }

  /**Updates all course IDs for a user. Returns true if succesful */
  static async updateUserCourses(user: User, canvasInstanceID: string): Promise<boolean> {
    if ( user.canvas.token === undefined ) {
      return false
    }
    const canvas = await sofa.db.canvas.get(canvasInstanceID);
    const courses = await Axios.request<allCourses>({
      headers: {
        Authorization: `Bearer ${user.canvas.token}`
      },
      params: {
        query: `
          query MyQuery {
            allCourses {
              _id
            }
          }
        `
      },
      method: 'POST',
      baseURL: canvas.endpoint,
      url: '/api/graphql'
    }).then((d) => {
      return d.data.data.allCourses;
    });
    // TODO: check refresh tokens etc
    user.courses =  courses.map((c) => c._id);
    return sofa.db.users.insert(user)
      .then(() => true)
      .catch((err) => {
        console.error('Failed to insert user with updated courses in db');
        return false;
      });
  }
}
