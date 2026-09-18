// const multer = require("multer");
// const crypto = require("crypto");
// const mongoose = require("mongoose");
// const { pipeline } = require("stream/promises");
// const storage = require("../../middleWare/aploadImage");
// const Assessment = require("../../modules/waterPoint/waterPointAssessmentModel");
// const Cleanup = require("../../modules/waterPoint/storageCleanupModel");
// const isReferenced = require("./storageReferences");
// const {
//   WaterPoint,
//   error,
//   send,
//   transaction,
//   lockPoint,
//   RegistryError,
// } = require("./common");
// const types = {
//   "image/jpeg": ".jpg",
//   "image/png": ".png",
//   "image/webp": ".webp",
//   "application/pdf": ".pdf",
// };
// let uploading = 0;
// exports.uploadSlot = (req, res, next) => {
//   if (uploading >= 4)
//     return res
//       .status(429)
//       .set("Retry-After", "5")
//       .json({
//         success: false,
//         message: "Upload capacity busy; retry shortly",
//         errors: [],
//       });
//   if (Number(req.headers["content-length"]) > 25 * 1024 * 1024 + 65536)
//     return res
//       .status(413)
//       .json({
//         success: false,
//         message: "Upload request too large",
//         errors: [],
//       });
//   uploading++;
//   let released = false;
//   const release = () => {
//     if (!released) {
//       released = true;
//       uploading--;
//     }
//   };
//   res.once("finish", release);
//   res.once("close", release);
//   next();
// };
// function signature(buffer, mime) {
//   if (mime === "image/jpeg")
//     return (
//       buffer.length > 3 &&
//       buffer.subarray(0, 3).equals(Buffer.from([255, 216, 255]))
//     );
//   if (mime === "image/png")
//     return (
//       buffer.length > 8 &&
//       buffer
//         .subarray(0, 8)
//         .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
//     );
//   if (mime === "image/webp")
//     return (
//       buffer.length > 12 &&
//       buffer.toString("ascii", 0, 4) === "RIFF" &&
//       buffer.toString("ascii", 8, 12) === "WEBP"
//     );
//   return (
//     mime === "application/pdf" && buffer.toString("ascii", 0, 5) === "%PDF-"
//   );
// }
// exports.parse = (kind) =>
//   multer({
//     storage: multer.memoryStorage(),
//     limits: {
//       fileSize: 5 * 1024 * 1024,
//       files: 5,
//       fields: 0,
//       parts: 6,
//       fieldNestingDepth: 0,
//     },
//     fileFilter: (_req, file, cb) =>
//       (kind === "documents"
//         ? file.mimetype === "application/pdf"
//         : file.mimetype.startsWith("image/")) && types[file.mimetype]
//         ? cb(null, true)
//         : cb(
//             new RegistryError(
//               400,
//               "Supported files: JPEG, PNG, WebP photos or PDF documents",
//             ),
//           ),
//   }).array("files", 5);
// async function cleanup(objects) {
//   for (const obj of objects) {
//     try {
//       // An uncertain transaction commit must not remove an attachment that was saved.
//       if (!(await isReferenced(obj.key, obj.bucket)))
//         await storage.deleteObjectFromR2(obj.key, obj.bucket);
//     } catch {
//       try {
//         await Cleanup.create({ key: obj.key, bucket: obj.bucket });
//       } catch {
//         console.error("Registry cleanup persistence failed", { key: obj.key });
//       }
//     }
//   }
// }
// exports.upload =
//   (kind, assessment = false) =>
//   async (req, res) => {
//     if (!req.files?.length) error(400, "At least one file is required");
//     for (const file of req.files)
//       if (!signature(file.buffer, file.mimetype))
//         error(400, "File content does not match its MIME type");
//     const bucket = process.env.WATER_REGISTRY_BUCKET;
//     if (!bucket) error(503, "Private registry storage is not configured");
//     const target = assessment
//       ? await Assessment.findById(req.params.assessmentId)
//       : await WaterPoint.findById(req.params.id);
//     if (!target)
//       error(404, assessment ? "Assessment not found" : "Water point not found");
//     const pointId = assessment ? target.waterPoint : target._id;
//     if (!(await WaterPoint.exists({ _id: pointId, isActive: true })))
//       error(409, "Water point is archived");
//     const max = kind === "documents" ? 10 : 20;
//     if (target[kind].length + req.files.length > max)
//       error(409, "Attachment capacity reached");
//     const uploaded = [];
//     try {
//       for (const file of req.files) {
//         const _id = new mongoose.Types.ObjectId(),
//           key = `water-registry/${pointId}/${crypto.randomUUID()}${types[file.mimetype]}`;
//         const item = {
//           _id,
//           key,
//           bucket,
//           url: `/api/water-registry/${assessment ? "assessments/" + target._id : "water-points/" + pointId}/files/${_id}`,
//           fileName: file.originalname
//             .replace(/[\x00-\x1f\x7f\\/]/g, "_")
//             .slice(0, 200),
//           mimeType: file.mimetype,
//           size: file.size,
//           uploadedAt: new Date(),
//           uploadedBy: req.user.id,
//         };
//         // Include attempted key in compensation: a timed-out PUT may have succeeded remotely.
//         uploaded.push(item);
//         await storage.putImageToR2(file.buffer, file.mimetype, key, bucket);
//       }
//       await transaction(async (session) => {
//         const point = await lockPoint(pointId, session);
//         const doc = assessment
//           ? await Assessment.findById(target._id).session(session)
//           : point;
//         if (doc[kind].length + uploaded.length > max)
//           error(409, "Attachment capacity reached");
//         doc[kind].push(...uploaded);
//         if (!assessment) doc.updatedBy = req.user.id;
//         await doc.save({ session });
//       });
//     } catch (err) {
//       await cleanup(uploaded);
//       throw err;
//     }
//     send(res, uploaded, "Files attached", 201);
//   };
// exports.download = (assessment) => async (req, res) => {
//   const doc = assessment
//     ? await Assessment.findById(req.params.assessmentId)
//     : await WaterPoint.findById(req.params.id);
//   if (!doc) error(404, "Record not found");
//   const file = [...doc.photos, ...(doc.documents || [])].find(
//     (f) => String(f._id) === req.params.fileId,
//   );
//   if (!file) error(404, "Attachment not found");
//   const object = await storage.getObjectFromR2(file.key, file.bucket);
//   res.set({
//     "Content-Type": file.mimeType,
//     "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(file.fileName)}`,
//     "Cache-Control": "private, no-store",
//     "X-Content-Type-Options": "nosniff",
//   });
//   await pipeline(object.Body, res);
// };


const multer = require("multer");
const crypto = require("crypto");
const mongoose = require("mongoose");

const {
  pipeline,
} = require("stream/promises");

const storage = require(
  "../../middleWare/aploadImage",
);

const Assessment = require(
  "../../modules/waterPoint/waterPointAssessmentModel",
);

const Cleanup = require(
  "../../modules/waterPoint/storageCleanupModel",
);

const isReferenced = require(
  "./storageReferences",
);

const {
  WaterPoint,
  error,
  send,
  transaction,
  lockPoint,
  RegistryError,
} = require("./common");

/*
|--------------------------------------------------------------------------
| SUPPORTED FILE TYPES
|--------------------------------------------------------------------------
*/

const types = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "application/pdf": ".pdf",
};

/*
 * Official Assessment Evidence requirement:
 *
 * JPG / JPEG
 * PNG
 * PDF
 *
 * WebP remains supported only by the
 * existing legacy photo system.
 */

const evidenceTypes = new Set([
  "image/jpeg",
  "image/png",
  "application/pdf",
]);

/*
|--------------------------------------------------------------------------
| UPLOAD CONCURRENCY LIMIT
|--------------------------------------------------------------------------
*/

let uploading = 0;

exports.uploadSlot = (
  req,
  res,
  next,
) => {
  if (uploading >= 4) {
    return res
      .status(429)
      .set(
        "Retry-After",
        "5",
      )
      .json({
        success: false,
        message:
          "Upload capacity busy; retry shortly",
        errors: [],
      });
  }

  /*
   * Maximum request protection.
   *
   * Individual files are also restricted
   * by Multer below.
   */
  if (
    Number(
      req.headers[
        "content-length"
      ],
    ) >
    25 * 1024 * 1024 +
      65536
  ) {
    return res
      .status(413)
      .json({
        success: false,
        message:
          "Upload request too large",
        errors: [],
      });
  }

  uploading++;

  let released = false;

  const release = () => {
    if (!released) {
      released = true;
      uploading--;
    }
  };

  res.once(
    "finish",
    release,
  );

  res.once(
    "close",
    release,
  );

  next();
};

/*
|--------------------------------------------------------------------------
| FILE SIGNATURE VALIDATION
|--------------------------------------------------------------------------
|
| Do not trust MIME type alone.
|
*/

function signature(
  buffer,
  mime,
) {
  if (
    mime === "image/jpeg"
  ) {
    return (
      buffer.length > 3 &&
      buffer
        .subarray(0, 3)
        .equals(
          Buffer.from([
            255,
            216,
            255,
          ]),
        )
    );
  }

  if (
    mime === "image/png"
  ) {
    return (
      buffer.length > 8 &&
      buffer
        .subarray(0, 8)
        .equals(
          Buffer.from([
            137,
            80,
            78,
            71,
            13,
            10,
            26,
            10,
          ]),
        )
    );
  }

  if (
    mime === "image/webp"
  ) {
    return (
      buffer.length > 12 &&
      buffer.toString(
        "ascii",
        0,
        4,
      ) === "RIFF" &&
      buffer.toString(
        "ascii",
        8,
        12,
      ) === "WEBP"
    );
  }

  if (
    mime ===
    "application/pdf"
  ) {
    return (
      buffer.length >= 5 &&
      buffer.toString(
        "ascii",
        0,
        5,
      ) === "%PDF-"
    );
  }

  return false;
}

/*
|--------------------------------------------------------------------------
| MULTIPART PARSER
|--------------------------------------------------------------------------
|
| kind:
|
| photos
|     Existing Water Source / legacy assessment photos.
|
| documents
|     Existing Water Source PDFs.
|
| evidence
|     NEW Assessment evidence.
|     Allows JPEG / PNG / PDF together.
|
*/

exports.parse = (kind) =>
  multer({
    storage:
      multer.memoryStorage(),

    limits: {
      /*
       * Maximum 5 MB per individual file.
       */
      fileSize:
        5 * 1024 * 1024,

      /*
       * Maximum 5 files per request.
       *
       * Assessment can still have up to 20
       * total evidence files through
       * multiple requests.
       */
      files: 5,

      fields: 0,
      parts: 6,
      fieldNestingDepth: 0,
    },

    fileFilter: (
      _req,
      file,
      cb,
    ) => {
      /*
       * Assessment Evidence
       */
      if (
        kind === "evidence"
      ) {
        if (
          evidenceTypes.has(
            file.mimetype,
          )
        ) {
          return cb(
            null,
            true,
          );
        }

        return cb(
          new RegistryError(
            400,
            "Assessment evidence supports JPEG, PNG and PDF files only",
          ),
        );
      }

      /*
       * Water Point documents
       */
      if (
        kind === "documents"
      ) {
        if (
          file.mimetype ===
          "application/pdf"
        ) {
          return cb(
            null,
            true,
          );
        }

        return cb(
          new RegistryError(
            400,
            "Water point documents must be PDF files",
          ),
        );
      }

      /*
       * Existing photos
       */
      if (
        kind === "photos"
      ) {
        if (
          [
            "image/jpeg",
            "image/png",
            "image/webp",
          ].includes(
            file.mimetype,
          )
        ) {
          return cb(
            null,
            true,
          );
        }

        return cb(
          new RegistryError(
            400,
            "Supported photo files: JPEG, PNG and WebP",
          ),
        );
      }

      return cb(
        new RegistryError(
          400,
          "Unsupported upload type",
        ),
      );
    },
  }).array(
    "files",
    5,
  );

/*
|--------------------------------------------------------------------------
| R2 CLEANUP
|--------------------------------------------------------------------------
|
| If database persistence fails after an
| R2 upload, remove the orphaned object.
|
*/

async function cleanup(
  objects,
) {
  for (
    const obj of objects
  ) {
    try {
      /*
       * Never delete an object that is
       * already referenced by database data.
       */
      if (
        !(await isReferenced(
          obj.key,
          obj.bucket,
        ))
      ) {
        await storage.deleteObjectFromR2(
          obj.key,
          obj.bucket,
        );
      }
    } catch {
      /*
       * If immediate cleanup fails,
       * persist a cleanup job.
       */
      try {
        await Cleanup.create({
          key: obj.key,
          bucket:
            obj.bucket,
        });
      } catch {
        console.error(
          "Registry cleanup persistence failed",
          {
            key: obj.key,
          },
        );
      }
    }
  }
}

/*
|--------------------------------------------------------------------------
| UPLOAD
|--------------------------------------------------------------------------
|
| kind:
|
| photos
| documents
| assessmentDocuments
|
| assessment:
|
| false = WaterPoint
| true  = Assessment
|
*/

exports.upload =
  (
    kind,
    assessment = false,
  ) =>
  async (
    req,
    res,
  ) => {
    if (
      !req.files?.length
    ) {
      error(
        400,
        "At least one file is required",
      );
    }

    /*
     * Validate actual file contents.
     */
    for (
      const file of req.files
    ) {
      if (
        !signature(
          file.buffer,
          file.mimetype,
        )
      ) {
        error(
          400,
          "File content does not match its MIME type",
        );
      }
    }

    const bucket =
      process.env
        .WATER_REGISTRY_BUCKET;

    if (!bucket) {
      error(
        503,
        "Private registry storage is not configured",
      );
    }

    /*
     * Locate target record.
     */
    const target =
      assessment
        ? await Assessment.findById(
            req.params
              .assessmentId,
          )
        : await WaterPoint.findById(
            req.params.id,
          );

    if (!target) {
      error(
        404,
        assessment
          ? "Assessment not found"
          : "Water point not found",
      );
    }

    /*
     * Limited assessor accounts may attach
     * evidence only to assessments they created.
     *
     * Admin and Water users may manage any
     * assessment evidence.
     */
    if (
      assessment &&
      req.user.role ===
        "water_assessor" &&
      String(
        target.createdBy,
      ) !==
        String(req.user.id)
    ) {
      error(
        403,
        "You can only upload evidence to your own assessments",
      );
    }

    const pointId =
      assessment
        ? target.waterPoint
        : target._id;

    /*
     * Parent Water Source must still be active.
     */
    if (
      !(await WaterPoint.exists({
        _id: pointId,
        isActive: true,
      }))
    ) {
      error(
        409,
        "Water point is archived",
      );
    }

    /*
     * Capacity:
     *
     * WaterPoint documents = 10
     * Photos               = 20
     * Assessment evidence  = 20
     */
    const max =
      kind === "documents"
        ? 10
        : 20;

    /*
     * Make sure the array exists for
     * backward-compatible old documents.
     */
    const currentFiles =
      Array.isArray(
        target[kind],
      )
        ? target[kind]
        : [];

    if (
      currentFiles.length +
        req.files.length >
      max
    ) {
      error(
        409,
        "Attachment capacity reached",
      );
    }

    const uploaded = [];

    try {
      /*
       * Upload to private R2 storage.
       */
      for (
        const file of req.files
      ) {
        const _id =
          new mongoose.Types.ObjectId();

        const key =
          `water-registry/${pointId}/` +
          `${crypto.randomUUID()}` +
          `${types[file.mimetype]}`;

        const item = {
          _id,

          key,

          bucket,

          url:
            `/api/water-registry/` +
            `${
              assessment
                ? "assessments/" +
                  target._id
                : "water-points/" +
                  pointId
            }` +
            `/files/${_id}`,

          fileName:
            file.originalname
              .replace(
                /[\x00-\x1f\x7f\\/]/g,
                "_",
              )
              .slice(
                0,
                200,
              ),

          mimeType:
            file.mimetype,

          size:
            file.size,

          uploadedAt:
            new Date(),

          uploadedBy:
            req.user.id,
        };

        /*
         * Keep attempted item before PUT.
         * A timed-out PUT may still have
         * succeeded remotely.
         */
        uploaded.push(
          item,
        );

        await storage.putImageToR2(
          file.buffer,
          file.mimetype,
          key,
          bucket,
        );
      }

      /*
       * Persist references transactionally.
       */
      await transaction(
        async (
          session,
        ) => {
          const point =
            await lockPoint(
              pointId,
              session,
            );

          const doc =
            assessment
              ? await Assessment.findById(
                  target._id,
                ).session(
                  session,
                )
              : point;

          if (!doc) {
            error(
              404,
              assessment
                ? "Assessment not found"
                : "Water point not found",
            );
          }

          /*
           * Re-check ownership inside the
           * transaction to protect against
           * concurrent changes.
           */
          if (
            assessment &&
            req.user.role ===
              "water_assessor" &&
            String(
              doc.createdBy,
            ) !==
              String(
                req.user.id,
              )
          ) {
            error(
              403,
              "You can only upload evidence to your own assessments",
            );
          }

          const existing =
            Array.isArray(
              doc[kind],
            )
              ? doc[kind]
              : [];

          if (
            existing.length +
              uploaded.length >
            max
          ) {
            error(
              409,
              "Attachment capacity reached",
            );
          }

          /*
           * Old assessment documents may not
           * physically have the new field yet.
           */
          if (
            !Array.isArray(
              doc[kind],
            )
          ) {
            doc[kind] =
              [];
          }

          doc[kind].push(
            ...uploaded,
          );

          if (
            !assessment
          ) {
            doc.updatedBy =
              req.user.id;
          }

          await doc.save({
            session,
          });
        },
      );
    } catch (err) {
      await cleanup(
        uploaded,
      );

      throw err;
    }

    send(
      res,
      uploaded,
      "Files attached",
      201,
    );
  };

/*
|--------------------------------------------------------------------------
| DOWNLOAD
|--------------------------------------------------------------------------
*/

exports.download =
  (assessment) =>
  async (
    req,
    res,
  ) => {
    const doc =
      assessment
        ? await Assessment.findById(
            req.params
              .assessmentId,
          )
        : await WaterPoint.findById(
            req.params.id,
          );

    if (!doc) {
      error(
        404,
        "Record not found",
      );
    }

    /*
     * WaterPoint:
     * photos + documents
     *
     * Assessment:
     * legacy photos + assessmentDocuments
     */
    const availableFiles =
      assessment
        ? [
            ...(doc.photos ||
              []),

            ...(doc.assessmentDocuments ||
              []),
          ]
        : [
            ...(doc.photos ||
              []),

            ...(doc.documents ||
              []),
          ];

    const file =
      availableFiles.find(
        (item) =>
          String(item._id) ===
          req.params.fileId,
      );

    if (!file) {
      error(
        404,
        "Attachment not found",
      );
    }

    const object =
      await storage.getObjectFromR2(
        file.key,
        file.bucket,
      );

    res.set({
      "Content-Type":
        file.mimeType,

      "Content-Disposition":
        `attachment; filename*=UTF-8''${encodeURIComponent(
          file.fileName,
        )}`,

      "Cache-Control":
        "private, no-store",

      "X-Content-Type-Options":
        "nosniff",
    });

    await pipeline(
      object.Body,
      res,
    );
  };