---
trigger: always_on
---
# Exclusive Skills Rule

1. Trong toàn bộ dự án này, AI Agent **CHỈ ĐƯỢC PHÉP SỬ DỤNG** các kỹ năng (skills) có sẵn trong thư mục .agents/skills/ của dự án, bao gồm:
   - **Nhóm Dev App Skills** (25 kỹ năng từ trợ lý dev app: using-agent-skills, frontend-ui-engineering, frontend-design, debugging-and-error-recovery, test-driven-development, api-and-interface-design, v.v.)
   - **Nhóm Video & Thị Giác** (claude-video-watch từ claude-video-main)
   - **Nhóm Bộ Nhớ Ngữ Cảnh Dài Hạn** (agentmemory từ agentmemory-main: remember, recall, forget, handoff, agentmemory-rest-api, v.v.)

2. **TUYỆT ĐỐI CẤM** gọi hoặc sử dụng bất kỳ skill hệ thống nào khác (như alphafold, bigquery, chembl, firebase, flutter, android, science, dbt, dataform, v.v.).

3. Khi commit và push dự án, toàn bộ thư mục .agents/skills/ và .agents/rules/ **BẮT BUỘC** phải được push đồng bộ lên GitHub repo.