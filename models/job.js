"use strict";

const { underline } = require("colors");
const db = require("../db");
const { BadRequestError, NotFoundError, ExpressError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for jobs. */

class Jobs {
    /** Create a job (from data), update db, return new job data.
     *
     * data should be { title, salary, equity, company_handle }
     *
     * Returns { title, salary, equity, company_handle }
     *
     * Throws BadRequestError if duplicate job within company already in database for.
     * */


    static async create(data) {
        const result = await db.query(
            `INSERT INTO jobs (title,
                                 salary,
                                 equity,
                                 company_handle)
               VALUES ($1, $2, $3, $4)
               RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
            [
                data.title,
                data.salary,
                data.equity,
                data.companyHandle,
            ]);
        let job = result.rows[0];

        return job;
    }

    /** Find all jobs.
     *
     * Returns [{ title, salary, equity, company_handle }, ...]
     * */

    static async findAll(data) {
        let query = `
            SELECT id,
                    title,
                   salary,
                   equity,
                   company_handle
            FROM jobs`;

        let params = [];

        if (data) {
            if (data.title) {
                query += ` WHERE title ILIKE '%' || $1 || '%'`;
                params.push(data.title);
            }

            if (data.minSalary !== null && data.minSalary !== undefined) {
                if (params.length === 0) {
                    query += ` WHERE`;
                } else {
                    query += ` AND`;
                }

                query += ` salary >= $${params.length + 1}`;
                params.push(data.minSalary);
            }

            if (data.equity !== null && data.equity !== undefined) {
                // const roundedEquity = Math.round(data.equity)
                if (data.equity === "0") {
                    if (params.length === 0) {
                        query += ` WHERE`;
                    } else {
                        query += ` AND`;
                    }

                }
                query += ` equity = 0`;
            }
        }
        const jobRes = await db.query(query, params);
        return jobRes.rows;
    }


    /** Given a company handle, return data about jobs.
     *
     * Returns { handle, name, description, numEmployees, logoUrl, jobs }
     *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
     *
     * Throws NotFoundError if not found.
     **/

    static async get(id) {
        const jobRes = await db.query(
            `SELECT 
                c.name,
                c.handle,
                c.description,
                c.logo_url,
                c.num_employees,
                j.id,
                j.title,
                j.salary,
                j.equity,
                j.company_handle
           FROM companies AS c
           JOIN jobs AS j
           ON j.company_handle = c.handle 
           WHERE j.id = $1`, [id]);

        const jobs = jobRes.rows[0]
        console.log(`Job with ${id} returns: ${jobs}`)
        const jobsFormatted = jobRes.rows.map(j => ({

            id: j.id,
            title: j.title,
            salary: j.salary,
            equity: j.equity,
            company: {
                handle: j.handle,
                name: j.name,
                description: j.description,
                numEmployees: j.num_employees,
                logoUrl: j.logo_url,

            },



        }));

        if (!jobs) throw new NotFoundError(`No jobs with: ${id}`);
        return jobsFormatted;
    }

    /** Update company data with `data`.
     *
     * This is a "partial update" --- it's fine if data doesn't contain all the
     * fields; this only changes provided ones.
     *
     * Data can include: {name, description, numEmployees, logoUrl}
     *
     * Returns {handle, name, description, numEmployees, logoUrl}
     *
     * Throws NotFoundError if not found.
     */

    static async update(id, data) {
        const { setCols, values } = sqlForPartialUpdate(
            data,
            {
                title: "title",
                salary: "salary",
                equity: "equity"
            });
        const handleVarIdx = "$" + (values.length + 1);

        const querySql = `UPDATE jobs 
                      SET ${setCols} 
                      WHERE id = ${handleVarIdx} 
                      RETURNING 
                                title, 
                                salary, 
                                equity,
                                id,
                                company_handle`;

        const result = await db.query(querySql, [...values, id]);
        const job = result.rows[0];

        if (!job) throw new NotFoundError(`No jobs found`);

        return job;
    }

    /** Delete given company from database; returns undefined.
     *
     * Throws NotFoundError if company not found.
     **/

    static async remove(id) {
        const result = await db.query(
            `DELETE
           FROM jobs
           WHERE id = $1`,
            [id]);

        if (result.rowCount === 0){
            throw new NotFoundError(`Job Not Found`);
        }

    }
}


module.exports = Jobs;
