# 矩阵学习室

面向线性代数基础遗忘的研究生，把矩阵理论课程、PPT例题、往年期末题和学习通章节测验组织为可直接学习的网页。

在线学习：https://matrix-study-room-2026-q7n2.liuhaoyuray.chatgpt.site

## 使用

下载完整仓库并解压，双击 `打开矩阵学习室.cmd`，或用浏览器打开 `dist/index.html`。所有数学排版脚本、字体、题面与PDF均已包含，无需安装依赖。也可在仓库目录执行 `python -m http.server 8000`，浏览 `http://localhost:8000/dist/`。

## 内容

- 30个短课：先修工具、线性空间、线性映射与矩阵、矩阵分解、矩阵分析，以及学习通目录补充。
- 169道练习，其中105道为学习通五章真实原题。
- 54份PDF原始资料与50页学习通题面截图。
- 逐题练习、多选、独立参考讲解、错题回顾、个人笔记、进度保存、搜索与记录导入导出。

学习通题解来自独立数学推导，非官方答案。原题前提不完整或疑似笔误会保留并注明。这里的学习不会同步完成学习通正式任务。

学习记录只存于当前浏览器，更换设备或清理数据前，请先在网站内导出备份。

## 维护

编辑 `content-foundations.json`、`content-advanced.json`、`content-supplement.json` 或 `chaoxing-questions.json` 后，运行 `python build_web.py` 更新网页数据。原始资料映射保存在 `source-index.json`，实际文件位于 `dist/sources/`。

本仓库不含登录凭据、个人浏览器记录及Sites部署身份配置。课件与题面用于个人课程学习，未附加开源授权；KaTeX依其随附LICENSE使用。
