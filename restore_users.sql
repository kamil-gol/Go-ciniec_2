INSERT INTO "User" (id, email, password, "firstName", "lastName", "roleId", "isActive", "lastLoginAt", "createdAt", "updatedAt") VALUES
('36cef6e7-fbd2-4887-804c-64a68a3ddf26','fabian.strojnowski@gmail.com','$2a$10$Hal.ZdCa0Ceyw2RAdrLkQ.NfgVtXD6TXKy1x3IiV8oa4.yRDjv77G','Fabian','Strojnowski','09142bd5-79f2-4687-a39e-f8307bee2df7',true,'2026-02-22T17:14:31.557','2026-02-22T17:11:14.776',now()),
('ef21d9c5-622a-4e19-bae3-59c576298694','maciej.danielkiewicz@gmail.com','$2a$10$4Ta5C6gHEe4yRAyVsH8rpO/ECel71HsbxZBC9qyGYMekNKZw/r51O','Maciej','Testowy','09142bd5-79f2-4687-a39e-f8307bee2df7',true,'2026-02-27T22:30:40.383','2026-02-27T22:24:31.194',now()),
('c3f84a38-601d-4947-9195-3d93aa326930','damian.onderka@gmail.com','$2a$10$Tx4y4naTZDhm9cK2uFjPG.LHzkFkOBCA98Mzy4JIri54sNuNHG24.','Damian','Testowy','09142bd5-79f2-4687-a39e-f8307bee2df7',true,NULL,'2026-03-24T23:12:47.166',now()),
('89b5698c-1091-4d8b-b3d3-13700d67f086','kamilgolebiowski@10g.pl','$2a$10$sCyZcC8YOWrE2FbKvo0vwuQ6IhkyrhLN00rj.mpYxrFFuapL0pQjC','Kamil','Gołębiowski','09142bd5-79f2-4687-a39e-f8307bee2df7',true,'2026-03-28T15:15:29.245','2026-02-23T12:59:20.259',now())
ON CONFLICT (id) DO UPDATE SET email=EXCLUDED.email, password=EXCLUDED.password, "firstName"=EXCLUDED."firstName", "lastName"=EXCLUDED."lastName", "roleId"=EXCLUDED."roleId", "isActive"=EXCLUDED."isActive", "lastLoginAt"=EXCLUDED."lastLoginAt";

UPDATE "User" SET password='$2a$10$TWnFro7Tdw0zUpAI9M9eCOvBMrljUFTg6rE9Wjj.5BcWVn1RRdfR2' WHERE email='pracownik2@gosciniecrodzinny.pl';
UPDATE "User" SET password='$2a$10$qx.gzx0qG2du2JyMTwZx3OQjFvL4rGhgnz0DwxGGUr0baEIj0.uhy' WHERE email='pracownik1@gosciniecrodzinny.pl';
UPDATE "User" SET password='$2a$12$yTMZOIMStowfqX.J6XJ8IeGskXA.Y817Gap4KYCWF6XuKGmc.xBO.' WHERE email='admin@gosciniecrodzinny.pl';
