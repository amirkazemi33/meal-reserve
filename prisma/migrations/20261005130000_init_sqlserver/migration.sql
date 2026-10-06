BEGIN TRY

BEGIN TRAN;

-- CreateSchema
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = N'dbo') EXEC sp_executesql N'CREATE SCHEMA [dbo];';

-- CreateTable
CREATE TABLE [dbo].[User] (
    [id] NVARCHAR(1000) NOT NULL,
    [phone] NVARCHAR(1000) NOT NULL,
    [passwordHash] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [lastName] NVARCHAR(1000) NOT NULL CONSTRAINT [User_lastName_df] DEFAULT '',
    [isActive] BIT NOT NULL CONSTRAINT [User_isActive_df] DEFAULT 1,
    [deliveryLocationId] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [User_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [User_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [User_phone_key] UNIQUE NONCLUSTERED ([phone])
);

-- CreateTable
CREATE TABLE [dbo].[Role] (
    [id] NVARCHAR(1000) NOT NULL,
    [code] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Role_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Role_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Role_code_key] UNIQUE NONCLUSTERED ([code])
);

-- CreateTable
CREATE TABLE [dbo].[Permission] (
    [id] NVARCHAR(1000) NOT NULL,
    [code] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(1000),
    [route] NVARCHAR(1000),
    [menuKey] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Permission_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Permission_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Permission_code_key] UNIQUE NONCLUSTERED ([code])
);

-- CreateTable
CREATE TABLE [dbo].[UserRole] (
    [userId] NVARCHAR(1000) NOT NULL,
    [roleId] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [UserRole_pkey] PRIMARY KEY CLUSTERED ([userId],[roleId])
);

-- CreateTable
CREATE TABLE [dbo].[RolePermission] (
    [roleId] NVARCHAR(1000) NOT NULL,
    [permissionId] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [RolePermission_pkey] PRIMARY KEY CLUSTERED ([roleId],[permissionId])
);

-- CreateTable
CREATE TABLE [dbo].[DeliveryLocation] (
    [id] NVARCHAR(1000) NOT NULL,
    [title] NVARCHAR(1000) NOT NULL,
    [address] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(1000),
    [isActive] BIT NOT NULL CONSTRAINT [DeliveryLocation_isActive_df] DEFAULT 1,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [DeliveryLocation_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [DeliveryLocation_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[MealPeriod] (
    [id] NVARCHAR(1000) NOT NULL,
    [title] NVARCHAR(1000) NOT NULL,
    [startTime] NVARCHAR(1000) NOT NULL,
    [endTime] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(1000),
    [isActive] BIT NOT NULL CONSTRAINT [MealPeriod_isActive_df] DEFAULT 1,
    [sortOrder] INT NOT NULL CONSTRAINT [MealPeriod_sortOrder_df] DEFAULT 0,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [MealPeriod_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [MealPeriod_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Food] (
    [id] NVARCHAR(1000) NOT NULL,
    [title] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(1000),
    [kind] NVARCHAR(1000) NOT NULL CONSTRAINT [Food_kind_df] DEFAULT 'MAIN',
    [isActive] BIT NOT NULL CONSTRAINT [Food_isActive_df] DEFAULT 1,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Food_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Food_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[MenuItem] (
    [id] NVARCHAR(1000) NOT NULL,
    [date] DATETIME2 NOT NULL,
    [mealPeriodId] NVARCHAR(1000) NOT NULL,
    [foodId] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [MenuItem_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [MenuItem_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [MenuItem_date_mealPeriodId_foodId_key] UNIQUE NONCLUSTERED ([date],[mealPeriodId],[foodId])
);

-- CreateTable
CREATE TABLE [dbo].[Reservation] (
    [id] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000) NOT NULL,
    [date] DATETIME2 NOT NULL,
    [mealPeriodId] NVARCHAR(1000) NOT NULL,
    [foodId] NVARCHAR(1000) NOT NULL,
    [menuItemId] NVARCHAR(1000),
    [drinkFoodId] NVARCHAR(1000),
    [drinkMenuItemId] NVARCHAR(1000),
    [sideFoodId] NVARCHAR(1000),
    [sideMenuItemId] NVARCHAR(1000),
    [deliveryLocationId] NVARCHAR(1000) NOT NULL,
    [quantity] INT NOT NULL CONSTRAINT [Reservation_quantity_df] DEFAULT 1,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [Reservation_status_df] DEFAULT 'ACTIVE',
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Reservation_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Reservation_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Reservation_userId_date_mealPeriodId_key] UNIQUE NONCLUSTERED ([userId],[date],[mealPeriodId])
);

-- CreateTable
CREATE TABLE [dbo].[Feedback] (
    [id] NVARCHAR(1000) NOT NULL,
    [reservationId] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000) NOT NULL,
    [rating] INT NOT NULL,
    [comment] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Feedback_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Feedback_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Feedback_reservationId_key] UNIQUE NONCLUSTERED ([reservationId])
);

-- CreateTable
CREATE TABLE [dbo].[AppSetting] (
    [id] NVARCHAR(1000) NOT NULL,
    [key] NVARCHAR(1000) NOT NULL,
    [value] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [AppSetting_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [AppSetting_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [AppSetting_key_key] UNIQUE NONCLUSTERED ([key])
);

-- CreateTable
CREATE TABLE [dbo].[UserList] (
    [id] NVARCHAR(1000) NOT NULL,
    [ownerId] NVARCHAR(1000) NOT NULL,
    [title] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [UserList_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [UserList_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[UserListMember] (
    [listId] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [UserListMember_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [UserListMember_pkey] PRIMARY KEY CLUSTERED ([listId],[userId])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [User_deliveryLocationId_idx] ON [dbo].[User]([deliveryLocationId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [UserRole_roleId_idx] ON [dbo].[UserRole]([roleId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [RolePermission_permissionId_idx] ON [dbo].[RolePermission]([permissionId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Food_kind_idx] ON [dbo].[Food]([kind]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [MenuItem_date_idx] ON [dbo].[MenuItem]([date]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [MenuItem_mealPeriodId_idx] ON [dbo].[MenuItem]([mealPeriodId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [MenuItem_foodId_idx] ON [dbo].[MenuItem]([foodId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Reservation_userId_idx] ON [dbo].[Reservation]([userId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Reservation_date_idx] ON [dbo].[Reservation]([date]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Reservation_status_idx] ON [dbo].[Reservation]([status]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Reservation_foodId_idx] ON [dbo].[Reservation]([foodId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Reservation_mealPeriodId_idx] ON [dbo].[Reservation]([mealPeriodId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Reservation_deliveryLocationId_idx] ON [dbo].[Reservation]([deliveryLocationId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Reservation_drinkFoodId_idx] ON [dbo].[Reservation]([drinkFoodId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Reservation_sideFoodId_idx] ON [dbo].[Reservation]([sideFoodId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Feedback_userId_idx] ON [dbo].[Feedback]([userId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [UserList_ownerId_idx] ON [dbo].[UserList]([ownerId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [UserListMember_userId_idx] ON [dbo].[UserListMember]([userId]);

-- AddForeignKey
ALTER TABLE [dbo].[User] ADD CONSTRAINT [User_deliveryLocationId_fkey] FOREIGN KEY ([deliveryLocationId]) REFERENCES [dbo].[DeliveryLocation]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[UserRole] ADD CONSTRAINT [UserRole_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[UserRole] ADD CONSTRAINT [UserRole_roleId_fkey] FOREIGN KEY ([roleId]) REFERENCES [dbo].[Role]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[RolePermission] ADD CONSTRAINT [RolePermission_roleId_fkey] FOREIGN KEY ([roleId]) REFERENCES [dbo].[Role]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[RolePermission] ADD CONSTRAINT [RolePermission_permissionId_fkey] FOREIGN KEY ([permissionId]) REFERENCES [dbo].[Permission]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[MenuItem] ADD CONSTRAINT [MenuItem_mealPeriodId_fkey] FOREIGN KEY ([mealPeriodId]) REFERENCES [dbo].[MealPeriod]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[MenuItem] ADD CONSTRAINT [MenuItem_foodId_fkey] FOREIGN KEY ([foodId]) REFERENCES [dbo].[Food]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Reservation] ADD CONSTRAINT [Reservation_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Reservation] ADD CONSTRAINT [Reservation_mealPeriodId_fkey] FOREIGN KEY ([mealPeriodId]) REFERENCES [dbo].[MealPeriod]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Reservation] ADD CONSTRAINT [Reservation_foodId_fkey] FOREIGN KEY ([foodId]) REFERENCES [dbo].[Food]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Reservation] ADD CONSTRAINT [Reservation_menuItemId_fkey] FOREIGN KEY ([menuItemId]) REFERENCES [dbo].[MenuItem]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Reservation] ADD CONSTRAINT [Reservation_drinkFoodId_fkey] FOREIGN KEY ([drinkFoodId]) REFERENCES [dbo].[Food]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Reservation] ADD CONSTRAINT [Reservation_drinkMenuItemId_fkey] FOREIGN KEY ([drinkMenuItemId]) REFERENCES [dbo].[MenuItem]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Reservation] ADD CONSTRAINT [Reservation_sideFoodId_fkey] FOREIGN KEY ([sideFoodId]) REFERENCES [dbo].[Food]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Reservation] ADD CONSTRAINT [Reservation_sideMenuItemId_fkey] FOREIGN KEY ([sideMenuItemId]) REFERENCES [dbo].[MenuItem]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Reservation] ADD CONSTRAINT [Reservation_deliveryLocationId_fkey] FOREIGN KEY ([deliveryLocationId]) REFERENCES [dbo].[DeliveryLocation]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Feedback] ADD CONSTRAINT [Feedback_reservationId_fkey] FOREIGN KEY ([reservationId]) REFERENCES [dbo].[Reservation]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Feedback] ADD CONSTRAINT [Feedback_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[UserList] ADD CONSTRAINT [UserList_ownerId_fkey] FOREIGN KEY ([ownerId]) REFERENCES [dbo].[User]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[UserListMember] ADD CONSTRAINT [UserListMember_listId_fkey] FOREIGN KEY ([listId]) REFERENCES [dbo].[UserList]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[UserListMember] ADD CONSTRAINT [UserListMember_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
