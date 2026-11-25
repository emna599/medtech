# 项目接手说明

你将协助我继续开发一个学校团队项目。请先读完以下全部内容再开始工作。

## 1. 项目背景

法国一家 EHPAD（养老院，约 80 位住户）的护理追溯管理系统，名为 medtech。
团队 3 人，按界面分工，我负责 **espace médecin（医生界面）** 的前端和后端。

医生界面包含 8 个用例：
- Consulter les résidents（住户列表）
- Rechercher un résident（搜索住户）
- Consulter la fiche médicale（查看医疗档案）
- Antécédents et traitements（既往史与治疗）
- Gérer allergies et régimes（管理过敏与膳食方案，可写）
- Générer un QR code（生成二维码）
- Télécharger / imprimer le QR（下载/打印二维码）
- Désactiver ou renouveler QR（停用/续期二维码）

## 2. 仓库结构

```
medtech/
├── backend/     Spring Boot
├── frontend/    Angular
├── database/    init.sql
└── .env.example
```

## 3. 技术栈（版本固定，不要升级）

后端：Spring Boot 4.2.0、Java 21 (Temurin)、Maven（用仓库自带的 mvnw）
依赖：spring-boot-starter-webmvc、data-jpa、security、validation、
      postgresql (runtime)、jjwt 0.12.6、**zxing 3.5.3（core + javase，用于生成二维码）**

前端：Angular 22.3、Angular Material 22.3、TypeScript 6.0、RxJS 7.8
      standalone components（无 NgModule）、signals、新控制流语法 @if / @for / @empty
      文件命名不带 .component 后缀（例如 app.ts、app.html）

数据库：PostgreSQL 16

## 4. 后端代码约定（严格遵守）

包名：com.esigelec.ehpad_backend
分层：entity → repository → service → mapper → dto → controller
     另有 config、security、exception 三个包

Entity 写法（参照已有的 User.java，动手前请先读它）：
- **不使用 Lombok**，手写 getter / setter
- @Entity + @Table(name = "...")，表名复数、snake_case
- 主键一律 Long + @GeneratedValue(strategy = GenerationType.IDENTITY)
- id 只有 getter，没有 setter
- 字段 camelCase，列名 snake_case 时显式写 @Column(name = "...")
- @Column 显式声明 nullable / unique / length
- 枚举用 @Enumerated(EnumType.STRING)
- import 逐个列出，不用通配符
- 代码注释用**法语**

关联方向（已定，不要改）：
- Resident 持有 @ManyToOne Room（外键 room_id 在 residents 表）
- 其余子实体（MedicalRecord、Allergy、DietaryRegime、QrCode）持有指向
  Resident 的 @ManyToOne / @OneToOne，外键在子表
- **Resident 里不放 @OneToMany 集合**，避免 JSON 循环和懒加载异常，
  查询统一用 repository 的 findByResidentId(...)

## 5. 当前进度

已完成（队友做的，**不要修改**）：
- entity/User.java、entity/Role.java
- 完整的 JWT 认证链路：AuthController、AuthService、UserMapper、
  UserRepository、JwtService、JwtAuthenticationFilter、SecurityConfig、
  CorsConfig、GlobalExceptionHandler、相关 DTO
- 前端已配好 Angular Material 主题（styles.scss 中的 mat.theme()）

已完成（我做的）：
- entity/Room.java
- entity/Resident.java（id、firstName、lastName、birthDate、admissionDate、
  active、@ManyToOne Room）
- entity/MedicalRecord.java（@OneToOne Resident、history、treatments、
  updatedAt 由 @PrePersist/@PreUpdate 维护）

前端现状：
- src/app/ 下有 core（auth / guards / interceptors）、features
  （medecin / personnel / residents）、shared（components / models）
- app.routes.ts 目前是空数组，医生界面的路由由我添加
- 尚未写任何医生界面的组件

## 6. 接下来的任务顺序

迭代 1 —— 住户列表 + 搜索 + 查看医疗档案（只读）
1. ResidentRepository、MedicalRecordRepository、RoomRepository
2. DTO：ResidentSummaryDto（列表用）、ResidentDetailDto、MedicalRecordDto
3. ResidentMapper（手写，参照 UserMapper 的风格）
4. ResidentService
5. ResidentController：GET /api/residents、GET /api/residents/{id}
6. 前端：models、service（HttpClient）、列表页、详情页、路由

迭代 2 —— Gérer allergies et régimes
新增 entity Allergy、DietaryRegime，对应的 repository / DTO / 接口，前端表单

迭代 3 —— QR 码
新增 entity QrCode，用 zxing 生成图片，支持下载、打印、停用、续期

## 7. 环境约束

- 开发机是 Windows 10，终端用 PowerShell
- **本地没有 Docker**，PostgreSQL 将以原生方式安装
- 仓库里目前**没有 docker-compose.yml**
- 因此后端现在**只能编译（mvnw compile），不能运行**，数据库尚未就绪
- .env.example 里有个矛盾：POSTGRES_USER=medtech 但 DB_USERNAME=postgres，
  已反馈给团队，暂时不要自行修改

## 8. 工作方式要求

- **一次只输出一个文件**，等我确认建好并编译通过，再给下一个
- 输出完整文件内容，不要用「...省略」这类占位
- 写新代码前先读已有的同类文件（User.java、AuthController.java、
  UserMapper.java），保持风格一致
- **不要引入任何新依赖**，需要的话先问我
- **不要修改 security/、config/、exception/ 包和认证相关文件**，那是队友的
- **不要修改 docker-compose.yml、.env.example、database/init.sql**
- 代码注释用法语；和我对话用中文
- 不要主动生成 mock 数据，除非我明确要求