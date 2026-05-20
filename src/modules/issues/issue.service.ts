import { pool } from "../../db/db";

const createIssueIntoDB = async (data: any) => {
  const result = await pool.query(
    `INSERT INTO issues (title, description, type, reporter_id)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [data.title, data.description, data.type, data.reporter_id]
  );

  return result.rows[0];
};

const getAllIssuesFromDB = async (query: any) => {
  let sql = `SELECT * FROM issues WHERE 1=1`;
  const values: any[] = [];

  if (query.status) {
    values.push(query.status);
    sql += ` AND status = $${values.length}`;
  }

  if (query.type) {
    values.push(query.type);
    sql += ` AND type = $${values.length}`;
  }

  sql += ` ORDER BY created_at DESC`;

  const result = await pool.query(sql, values);
  return result.rows;
};

const getSingleIssueFromDB = async (id: string) => {
  const result = await pool.query(
    `SELECT * FROM issues WHERE id=$1`,
    [id]
  );

  return result.rows[0];
};

export const updateIssueIntoDB = async (
  id: string,
  payload: any
) => {
  console.log(payload);

  const result = await pool.query(
    `
    UPDATE issues
    SET
      title = $1,
      description = $2,
      type = $3,
      status = $4,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $5
    RETURNING *
    `,
    [
      payload.title,
      payload.description,
      payload.type,
      payload.status,
      id,
    ]
  );

  return result.rows[0];
};

const deleteIssueFromDB = async (id: string) => {
  await pool.query(`DELETE FROM issues WHERE id=$1`, [id]);
  return true;
};

export const issueService = {
    createIssueIntoDB,
    getAllIssuesFromDB,
    getSingleIssueFromDB,
    updateIssueIntoDB,
    deleteIssueFromDB,
}