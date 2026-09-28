# GitHub Actions disabled

Portfolio SiteはGitHub Actionsを実行基盤として使用しません。
実行可能な `.yml` / `.yaml` workflowはこのディレクトリに置きません。

merge前検証:

```powershell
.\scripts\Test-MergeReadiness.ps1
```

production deploy:

```powershell
python .\scripts\deploy_production.py
```

デプロイ資格情報はGitHub Secretsではなく、実行時のローカル環境変数から読みます。
過去のworkflow定義は `../workflows-disabled/` に参照用として退避しています。
