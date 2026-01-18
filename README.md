# Discord Botの雛形 TypeScriptバージョン

## セットアップ手順

1. このフォルダーをコマンドプロンプト等で開く（`cd`コマンドを使用）
2. `npm install`を実行
   ※npmが未インストールの場合は事前にインストールが必要
3. [.env](.env)ファイルにBotの`APPLICATION_ID`と`TOKEN`を設定
   ※.env.exampleの中身をコピー
   ※[.env]を新規作成してそこにペースト

-----------------------------------------------------------------

## 新コマンドの作成手順

1. [commands](commands/)フォルダー直下に`コマンド名.ts`を作成
2. [help.ts](commands/help.ts)などのプログラムをコピーして使用
3. `.setName('help')`の`"help"`を設定したいコマンド名に変更（小文字のみ）
4. [deploy-commands.ts](deploy-commands.ts)に他のコマンドと同様に以下を追加：
   - `import`文
   - `コマンド名.data.toJSON()`
5. [script.ts](script.ts)に他のコマンドと同様に以下を追加：
   - `import`文  
   - switch文の中身

----------------------------------------------------------------- 

## Bot起動方法

1. `npm run build` を実行してTypeScriptをコンパイル
2. コマンドプロンプト上で `npm start` を実行
3. 辞める時は：`Ctrl+C`で強制終了できる
